import express from 'express';
import { protect } from '../middleware/auth.js';
import { createCheckout, getMySubscription, getPlans, verifyCheckout } from '../controllers/subscriptionController.js';

const router = express.Router();
router.get('/plans', getPlans);
router.get('/me', protect, getMySubscription);
router.post('/checkout', protect, createCheckout);
router.post('/verify', protect, verifyCheckout);
export default router;
