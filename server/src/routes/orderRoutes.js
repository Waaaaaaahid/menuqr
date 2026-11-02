import express from 'express';
import { getOrders, updateOrderStatus, updateOrderTimer } from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import { requireRestaurant } from '../middleware/restaurantAuth.js';

const router = express.Router();

router.use(protect, requireRestaurant);

router.get('/', getOrders);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/timer', updateOrderTimer);

export default router;
