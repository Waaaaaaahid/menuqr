import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import { initSocket } from './socket/socketHandler.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import menuItemRoutes from './routes/menuItemRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import { handleRazorpayWebhook } from './controllers/subscriptionController.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// JWT bearer authentication is used by the client, so cross-origin cookies
// are not needed. Restrict browser access to the configured frontend in production.
const clientOrigin = process.env.CLIENT_URL;
app.use(cors({
  origin: clientOrigin || '*',
  credentials: Boolean(clientOrigin),
}));
// Razorpay signs the exact raw webhook payload, so this route must run before express.json().
app.post('/api/subscriptions/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded static files
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'MenuQR API is healthy and running',
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Serve Client Static Build if available (SPA support)
const clientDistPath = path.resolve('../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Error Handling for unhandled routes
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Do not start accepting requests until the configured database is connected.
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`[Server] MenuQR backend server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('[Server] Startup aborted because MongoDB is unavailable:', error.message);
    process.exit(1);
  });

export default app;
