import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import MenuAnalytics from '../models/MenuAnalytics.js';
import { getIO } from '../socket/socketHandler.js';

// Helper to generate readable order number
const generateOrderNumber = () => {
  const chars = '0123456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `#ORD-${rand}`;
};

// @desc    Place a new table order (Customer)
// @route   POST /api/public/orders
// @access  Public
export const placeOrder = async (req, res, next) => {
  try {
    const {
      restaurantSlug,
      tableNumber,
      tableKey,
      customerName,
      customerPhone,
      items,
      specialNotes,
      paymentMethod,
    } = req.body;

    if (!restaurantSlug || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order request. Restaurant and items are required.',
      });
    }

    const restaurant = await Restaurant.findOne({ slug: restaurantSlug });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (!restaurant.tableOrderingEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Online table ordering is currently disabled for this restaurant.',
      });
    }

    // Orders are accepted only from a valid table-specific QR link.
    if (!tableNumber || !tableKey) {
      return res.status(400).json({ success: false, message: 'Please scan the QR code placed on your table to order.' });
    }
    const tableDoc = await Table.findOne({ restaurant: restaurant._id, tableNumber: tableNumber.trim(), qrToken: tableKey });
    if (!tableDoc) {
      return res.status(403).json({ success: false, message: 'This table QR code is invalid. Please scan the QR displayed on your table.' });
    }

    // Fetch and verify all items server-side to guarantee accurate pricing
    let subtotal = 0;
    let maxItemPrepMinutes = 0;
    let quantityLoadMinutes = 0;
    const verifiedOrderItems = [];

    for (const item of items) {
      const dbItem = await MenuItem.findOne({
        _id: item.menuItemId || item._id,
        restaurant: restaurant._id,
      });

      if (!dbItem) {
        return res.status(400).json({
          success: false,
          message: `Item not found or unavailable in restaurant: ${item.name || item.menuItemId}`,
        });
      }

      if (!dbItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Dish "${dbItem.name}" is currently sold out. Please adjust your cart.`,
        });
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);
      const itemTotal = dbItem.price * quantity;
      subtotal += itemTotal;
      const prepRange = String(dbItem.preparationTime || '15').match(/\\d+/g) || ['15'];
      const itemPrepMinutes = Math.max(1, Number(prepRange[prepRange.length - 1]) || 15);
      maxItemPrepMinutes = Math.max(maxItemPrepMinutes, itemPrepMinutes);
      quantityLoadMinutes += Math.max(0, quantity - 1) * 1.5;

      verifiedOrderItems.push({
        menuItem: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity,
        specialInstructions: item.specialInstructions || '',
        isVeg: dbItem.isVeg,
      });
    }

    // Calculate tax & service charge based on restaurant configuration
    const tax = Number(((subtotal * (restaurant.taxPercentage || 0)) / 100).toFixed(2));
    const serviceCharge = Number(
      ((subtotal * (restaurant.serviceChargePercentage || 0)) / 100).toFixed(2)
    );
    const totalAmount = Number((subtotal + tax + serviceCharge).toFixed(2));

    const estimatedPrepMinutes = Math.min(240, Math.max(1, Math.ceil(maxItemPrepMinutes + quantityLoadMinutes)));
    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      restaurant: restaurant._id,
      orderNumber,
      table: {
        id: tableDoc ? tableDoc._id : null,
        tableNumber: tableNumber.trim(),
        qrToken: tableDoc.qrToken,
      },
      customer: {
        name: customerName ? customerName.trim() : 'Guest',
        phone: customerPhone ? customerPhone.trim() : '',
      },
      items: verifiedOrderItems,
      subtotal,
      tax,
      serviceCharge,
      totalAmount,
      status: 'pending',
      prepTimeMinutes: estimatedPrepMinutes,
      prepRemainingSeconds: estimatedPrepMinutes * 60,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'unpaid',
      specialNotes: specialNotes || '',
    });

    // Update table status if table exists
    if (tableDoc) {
      tableDoc.status = 'occupied';
      tableDoc.activeOrder = order._id;
      await tableDoc.save();
    }

    // Log analytics event
    await MenuAnalytics.create({
      restaurant: restaurant._id,
      type: 'order',
      tableNumber: tableNumber || '',
    });

    // Broadcast real-time event to restaurant owner room via Socket.IO
    try {
      const io = getIO();
      if (io) {
        io.to(`restaurant_${restaurant._id}`).emit('new_order', order);
      }
    } catch (socketErr) {
      console.warn('Socket notification error (non-fatal):', socketErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! The kitchen has received your order.',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders for restaurant owner dashboard
// @route   GET /api/orders
// @access  Private (Owner)
export const getOrders = async (req, res, next) => {
  try {
    const { status, limit = 50, date } = req.query;

    const query = { restaurant: req.restaurant._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (date === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: startOfDay };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Owner)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      restaurant: req.restaurant._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const previousStatus = order.status;
    order.status = status;

    // The kitchen countdown starts only when the admin accepts the order.
    if (status === 'accepted' && previousStatus === 'pending') {
      const requestedMinutes = Number(req.body.prepTimeMinutes);
      if (Number.isFinite(requestedMinutes) && requestedMinutes >= 1 && requestedMinutes <= 240) {
        order.prepTimeMinutes = Math.round(requestedMinutes);
      }
      order.prepStartedAt = new Date();
      order.prepPausedAt = null;
      order.prepRemainingSeconds = order.prepTimeMinutes * 60;
      order.prepEndsAt = new Date(Date.now() + order.prepRemainingSeconds * 1000);
    }

    if (status === 'ready' || status === 'completed' || status === 'cancelled') {
      order.prepEndsAt = null;
      order.prepPausedAt = null;
      order.prepRemainingSeconds = 0;
    }

    // If completed or cancelled, mark paid or release table
    if (status === 'completed') {
      order.paymentStatus = 'paid';
    }

    await order.save();

    // Release table if completed or cancelled
    if (order.table?.id && (status === 'completed' || status === 'cancelled')) {
      await Table.findByIdAndUpdate(order.table.id, {
        status: 'available',
        activeOrder: null,
      });
    }

    // Broadcast real-time update
    try {
      const io = getIO();
      if (io) {
        // Emit to restaurant dashboard
        io.to(`restaurant_${req.restaurant._id}`).emit('order_status_updated', order);
        // Emit to diner tracking
        io.to(`order_${order._id}`).emit('customer_order_status', order);
      }
    } catch (socketErr) {
      console.warn('Socket notification error:', socketErr.message);
    }

    res.status(200).json({
      success: true,
      order,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Adjust, pause or resume an order preparation timer
// @route   PUT /api/orders/:id/timer
// @access  Private (Owner)
export const updateOrderTimer = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, restaurant: req.restaurant._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['accepted', 'preparing'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Timer can only be changed for accepted or preparing orders.' });
    }
    const now = new Date();
    const { minutes, action } = req.body;
    if (action === 'pause') {
      if (order.prepEndsAt && !order.prepPausedAt) {
        order.prepRemainingSeconds = Math.max(0, Math.ceil((order.prepEndsAt.getTime() - now.getTime()) / 1000));
        order.prepPausedAt = now;
        order.prepEndsAt = null;
      }
    } else if (action === 'resume') {
      if (order.prepPausedAt) {
        order.prepEndsAt = new Date(now.getTime() + Math.max(0, order.prepRemainingSeconds) * 1000);
        order.prepPausedAt = null;
        order.prepStartedAt = order.prepStartedAt || now;
      }
    } else if (minutes !== undefined) {
      const value = Number(minutes);
      if (!Number.isFinite(value) || value < 1 || value > 240) {
        return res.status(400).json({ success: false, message: 'Preparation time must be between 1 and 240 minutes.' });
      }
      order.prepTimeMinutes = Math.round(value);
      order.prepRemainingSeconds = order.prepTimeMinutes * 60;
      if (order.prepPausedAt) {
        order.prepEndsAt = null;
      } else {
        order.prepStartedAt = order.prepStartedAt || now;
        order.prepEndsAt = new Date(now.getTime() + order.prepRemainingSeconds * 1000);
      }
    } else {
      return res.status(400).json({ success: false, message: 'Provide minutes or a pause/resume action.' });
    }
    await order.save();
    const io = getIO();
    if (io) {
      io.to(`restaurant_${req.restaurant._id}`).emit('order_status_updated', order);
      io.to(`order_${order._id}`).emit('customer_order_status', order);
    }
    res.status(200).json({ success: true, order, message: 'Preparation timer updated.' });
  } catch (error) { next(error); }
};

// @desc    Get order details by ID (for live customer order tracking)
// @route   GET /api/public/orders/:id
// @access  Public
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const restaurant = await Restaurant.findById(order.restaurant).select(
      'name slug logo currency phone'
    );

    res.status(200).json({
      success: true,
      order,
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};
