import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import Order from '../models/Order.js';
import { getIO } from '../socket/socketHandler.js';

const hashValue = (value) => createHash('sha256').update(String(value || '')).digest('hex');
const matchesHash = (value, expectedHash) => {
  if (!value || !expectedHash) return false;
  const actual = Buffer.from(hashValue(value), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

const clearSession = (table) => {
  table.session = {
    status: 'none',
    customerName: '',
    otpHash: '',
    tokenHash: '',
    expiresAt: null,
    requestedAt: null,
    verifiedAt: null,
    attempts: 0,
  };
};

export const requestTableSession = async (req, res, next) => {
  try {
    const { restaurantSlug, tableNumber, tableKey, customerName } = req.body;
    const cleanName = String(customerName || '').trim().replace(/\s+/g, ' ');
    if (!restaurantSlug || !tableNumber || !tableKey || cleanName.length < 2 || cleanName.length > 60) {
      return res.status(400).json({ success: false, message: 'Enter your name and scan the QR code placed on your table.' });
    }

    const restaurant = await Restaurant.findOne({ slug: restaurantSlug }).select('_id');
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found.' });

    const table = await Table.findOne({
      restaurant: restaurant._id,
      tableNumber: String(tableNumber).trim(),
      qrToken: tableKey,
    });
    if (!table) return res.status(403).json({ success: false, message: 'Invalid table QR. Please scan the QR on your table.' });

    if (table.status === 'occupied' && table.session?.status !== 'active') {
      return res.status(409).json({ success: false, message: 'This table has an unfinished or existing order. Please ask the staff before starting a new session.' });
    }
    if (table.session?.status === 'active') {
      return res.status(409).json({ success: false, message: 'This table already has an active customer session. Please ask the staff.' });
    }
    if (table.session?.status === 'pending' && table.session.expiresAt && table.session.expiresAt > new Date()) {
      return res.status(409).json({ success: false, message: 'A verification request is already pending for this table. Please show your screen to the staff.' });
    }

    const otp = String(randomInt(100000, 1000000));
    const sessionToken = randomBytes(32).toString('hex');
    const now = new Date();
    table.session = {
      status: 'pending',
      customerName: cleanName,
      otpHash: hashValue(otp),
      tokenHash: hashValue(sessionToken),
      expiresAt: new Date(now.getTime() + 3 * 60 * 1000),
      requestedAt: now,
      verifiedAt: null,
      attempts: 0,
    };
    await table.save();

    try {
      const io = getIO();
      if (io) io.to(`restaurant_${restaurant._id}`).emit('table_session_requested', {
        tableId: table._id,
        tableNumber: table.tableNumber,
        customerName: cleanName,
        requestedAt: now,
      });
    } catch (socketError) {
      console.warn('Table session notification error:', socketError.message);
    }

    return res.status(201).json({
      success: true,
      otp,
      sessionToken,
      expiresAt: table.session.expiresAt,
      message: 'Show this OTP to restaurant staff to verify your table.',
    });
  } catch (error) {
    next(error);
  }
};

export const getTableSessionStatus = async (req, res, next) => {
  try {
    const { restaurantSlug, tableNumber, tableKey, sessionToken } = req.body;
    if (!restaurantSlug || !tableNumber || !tableKey || !sessionToken) {
      return res.status(400).json({ success: false, message: 'Missing table session details.' });
    }
    const restaurant = await Restaurant.findOne({ slug: restaurantSlug }).select('_id');
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    const table = await Table.findOne({
      restaurant: restaurant._id,
      tableNumber: String(tableNumber).trim(),
      qrToken: tableKey,
    }).select('session');
    if (!table || !matchesHash(sessionToken, table.session?.tokenHash)) {
      return res.status(403).json({ success: false, message: 'Table session not found. Please request verification again.' });
    }
    if (table.session.status === 'pending' && table.session.expiresAt && table.session.expiresAt <= new Date()) {
      return res.status(200).json({ success: true, status: 'expired', verified: false });
    }
    return res.status(200).json({
      success: true,
      status: table.session.status,
      verified: table.session.status === 'active',
      expiresAt: table.session.expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingTableSessions = async (req, res, next) => {
  try {
    const tables = await Table.find({
      restaurant: req.restaurant._id,
      'session.status': 'pending',
      'session.expiresAt': { $gt: new Date() },
    }).select('tableNumber session.customerName session.requestedAt session.expiresAt').sort({ 'session.requestedAt': 1 });

    res.status(200).json({
      success: true,
      requests: tables.map((table) => ({
        tableId: table._id,
        tableNumber: table.tableNumber,
        customerName: table.session.customerName,
        requestedAt: table.session.requestedAt,
        expiresAt: table.session.expiresAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const verifyTableSession = async (req, res, next) => {
  try {
    const otp = String(req.body.otp || '').trim();
    const table = await Table.findOne({ _id: req.params.id, restaurant: req.restaurant._id });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found.' });
    if (table.session?.status !== 'pending') {
      return res.status(409).json({ success: false, message: 'There is no pending verification for this table.' });
    }
    if (!table.session.expiresAt || table.session.expiresAt <= new Date()) {
      clearSession(table);
      await table.save();
      return res.status(410).json({ success: false, message: 'OTP expired. Ask the customer to request a new one.' });
    }
    if (!/^\d{6}$/.test(otp) || !matchesHash(otp, table.session.otpHash)) {
      table.session.attempts = (table.session.attempts || 0) + 1;
      if (table.session.attempts >= 5) clearSession(table);
      await table.save();
      return res.status(400).json({
        success: false,
        message: table.session.status === 'none' ? 'Too many incorrect attempts. Ask the customer to start again.' : 'Incorrect OTP. Please check with the customer.',
      });
    }

    table.session.status = 'active';
    table.session.otpHash = '';
    table.session.expiresAt = null;
    table.session.verifiedAt = new Date();
    table.status = 'occupied';
    await table.save();

    try {
      const io = getIO();
      if (io) io.to(`restaurant_${req.restaurant._id}`).emit('table_session_verified', {
        tableId: table._id,
        tableNumber: table.tableNumber,
        customerName: table.session.customerName,
      });
    } catch (socketError) {
      console.warn('Table session verified notification error:', socketError.message);
    }

    return res.status(200).json({ success: true, message: `Table ${table.tableNumber} verified and activated.` });
  } catch (error) {
    next(error);
  }
};

export const releaseTableSession = async (req, res, next) => {
  try {
    const table = await Table.findOne({ _id: req.params.id, restaurant: req.restaurant._id });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found.' });
    const unfinishedOrder = await Order.exists({
      restaurant: req.restaurant._id,
      'table.id': table._id,
      status: { $in: ['pending', 'accepted', 'preparing', 'ready'] },
    });
    if (unfinishedOrder) {
      return res.status(409).json({ success: false, message: 'This table still has an unfinished order. Complete or cancel it before releasing the session.' });
    }
    clearSession(table);
    table.status = 'available';
    table.activeOrder = null;
    await table.save();

    try {
      const io = getIO();
      if (io) io.to(`restaurant_${req.restaurant._id}`).emit('table_session_released', {
        tableId: table._id,
        tableNumber: table.tableNumber,
      });
    } catch (socketError) {
      console.warn('Table session release notification error:', socketError.message);
    }

    return res.status(200).json({ success: true, message: 'Table session released.' });
  } catch (error) {
    next(error);
  }
};
