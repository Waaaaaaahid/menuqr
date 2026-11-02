import express from 'express';
import { getPublicMenu } from '../controllers/restaurantController.js';
import { placeOrder, getOrderById } from '../controllers/orderController.js';
import { recordMenuView } from '../controllers/analyticsController.js';
import { requestTableSession, getTableSessionStatus } from '../controllers/tableSessionController.js';

const router = express.Router();

router.get('/menu/:slug', getPublicMenu);
router.post('/table-sessions/request', requestTableSession);
router.post('/table-sessions/status', getTableSessionStatus);
router.post('/orders', placeOrder);
router.get('/orders/:id', getOrderById);
router.post('/analytics/view', recordMenuView);

export default router;
