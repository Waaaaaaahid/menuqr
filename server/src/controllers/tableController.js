import Table from '../models/Table.js';
import { randomBytes } from 'crypto';
import Restaurant from '../models/Restaurant.js';
import { generateTableQRCode } from '../utils/qrGenerator.js';

// @desc    Get all tables for restaurant
// @route   GET /api/tables
// @access  Private (Owner)
export const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find({ restaurant: req.restaurant._id })
      .populate('activeOrder', 'orderNumber status totalAmount createdAt')
      .sort({ tableNumber: 1 });

    // Upgrade older tables created before QR tokens were introduced.
    for (const table of tables) {
      if (!table.qrToken) table.qrToken = randomBytes(24).toString('hex');
      if (!table.qrCodeSvg?.includes(table.qrToken)) {
        const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const qrInfo = await generateTableQRCode(clientBaseUrl, req.restaurant.slug, table.tableNumber, table.qrToken);
        table.qrCodeDataUrl = qrInfo.qrCodeDataUrl;
        table.qrCodeSvg = qrInfo.qrCodeSvg;
        await table.save();
      }
    }

    res.status(200).json({
      success: true,
      count: tables.length,
      tables,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new table
// @route   POST /api/tables
// @access  Private (Owner)
export const createTable = async (req, res, next) => {
  try {
    const { tableNumber, capacity } = req.body;

    if (!tableNumber) {
      return res.status(400).json({
        success: false,
        message: 'Table number or identifier is required',
      });
    }

    // Check duplicate table number
    const existing = await Table.findOne({
      restaurant: req.restaurant._id,
      tableNumber: tableNumber.trim(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Table "${tableNumber}" already exists in your restaurant`,
      });
    }

    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const qrToken = randomBytes(24).toString('hex');
    const qrInfo = await generateTableQRCode(
      clientBaseUrl,
      req.restaurant.slug,
      tableNumber.trim(),
      qrToken
    );

    const table = await Table.create({
      restaurant: req.restaurant._id,
      tableNumber: tableNumber.trim(),
      qrToken,
      capacity: capacity ? Number(capacity) : 4,
      status: 'available',
      qrCodeDataUrl: qrInfo.qrCodeDataUrl,
      qrCodeSvg: qrInfo.qrCodeSvg,
    });

    res.status(201).json({
      success: true,
      table,
      targetUrl: qrInfo.targetUrl,
      message: 'Table created and QR code generated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a table
// @route   PUT /api/tables/:id
// @access  Private (Owner)
export const updateTable = async (req, res, next) => {
  try {
    const table = await Table.findOne({
      _id: req.params.id,
      restaurant: req.restaurant._id,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    const { tableNumber, capacity, status } = req.body;

    if (tableNumber && tableNumber.trim() !== table.tableNumber) {
      const duplicate = await Table.findOne({
        restaurant: req.restaurant._id,
        _id: { $ne: table._id },
        tableNumber: tableNumber.trim(),
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Another table with number "${tableNumber}" already exists`,
        });
      }

      table.tableNumber = tableNumber.trim();
      // Regenerate QR code for updated table number
      const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const qrInfo = await generateTableQRCode(
        clientBaseUrl,
        req.restaurant.slug,
        table.tableNumber,
        table.qrToken
      );
      table.qrCodeDataUrl = qrInfo.qrCodeDataUrl;
      table.qrCodeSvg = qrInfo.qrCodeSvg;
    }

    if (capacity !== undefined) table.capacity = Number(capacity);
    if (status !== undefined) table.status = status;

    await table.save();

    res.status(200).json({
      success: true,
      table,
      message: 'Table updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a table
// @route   DELETE /api/tables/:id
// @access  Private (Owner)
export const deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findOne({
      _id: req.params.id,
      restaurant: req.restaurant._id,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    await Table.deleteOne({ _id: table._id });

    res.status(200).json({
      success: true,
      message: 'Table deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk create tables
// @route   POST /api/tables/bulk
// @access  Private (Owner)
export const bulkCreateTables = async (req, res, next) => {
  try {
    const { prefix = 'T-', start = 1, count = 5, capacity = 4 } = req.body;
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const createdTables = [];

    for (let i = 0; i < Number(count); i++) {
      const num = Number(start) + i;
      const formattedNum = num < 10 ? `0${num}` : `${num}`;
      const tableNumber = `${prefix}${formattedNum}`;

      // Skip if exists
      const exists = await Table.findOne({
        restaurant: req.restaurant._id,
        tableNumber,
      });

      if (!exists) {
        const qrToken = randomBytes(24).toString('hex');
        const qrInfo = await generateTableQRCode(
          clientBaseUrl,
          req.restaurant.slug,
          tableNumber,
          qrToken
        );

        const table = await Table.create({
          restaurant: req.restaurant._id,
          tableNumber,
          qrToken,
          capacity: Number(capacity),
          status: 'available',
          qrCodeDataUrl: qrInfo.qrCodeDataUrl,
          qrCodeSvg: qrInfo.qrCodeSvg,
        });

        createdTables.push(table);
      }
    }

    res.status(201).json({
      success: true,
      createdCount: createdTables.length,
      tables: createdTables,
      message: `Successfully created ${createdTables.length} new tables with QR codes`,
    });
  } catch (error) {
    next(error);
  }
};
