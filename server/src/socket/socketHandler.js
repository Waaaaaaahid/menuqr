import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
  });

  // Authenticate dashboard sockets. Public diners may still connect for their own order tracking.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'menuqr_super_secret_jwt_key_2026');
        const user = await User.findById(decoded.id).select('_id restaurant role');
        if (!user) return next(new Error('Unauthorized socket connection'));
        const restaurant = user.restaurant || (await Restaurant.findOne({ owner: user._id }).select('_id'))?._id;
        socket.data.userId = String(user._id);
        socket.data.restaurantId = restaurant ? String(restaurant) : null;
      }
      next();
    } catch (error) {
      next(new Error('Invalid socket authentication'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_restaurant', (restaurantId) => {
      if (socket.data.restaurantId && socket.data.restaurantId === String(restaurantId)) {
        socket.join(`restaurant_${restaurantId}`);
      }
    });

    socket.on('join_order', async (orderId) => {
      try {
        if (!/^[a-f\d]{24}$/i.test(String(orderId))) return;
        const exists = await Order.exists({ _id: orderId });
        if (exists) socket.join(`order_${orderId}`);
      } catch (error) {
        // Ignore invalid or expired order room requests.
      }
    });
  });

  return io;
};

export const getIO = () => io;
