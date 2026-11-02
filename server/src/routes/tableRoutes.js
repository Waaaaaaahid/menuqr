import express from 'express';
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  bulkCreateTables,
} from '../controllers/tableController.js';
import { getPendingTableSessions, verifyTableSession, releaseTableSession } from '../controllers/tableSessionController.js';
import { protect } from '../middleware/auth.js';
import { requireRestaurant } from '../middleware/restaurantAuth.js';

const router = express.Router();

router.use(protect, requireRestaurant);

router.route('/').get(getTables).post(createTable);
router.post('/bulk', bulkCreateTables);
router.get('/verifications', getPendingTableSessions);
router.post('/:id/verify', verifyTableSession);
router.post('/:id/release-session', releaseTableSession);
router.route('/:id').put(updateTable).delete(deleteTable);

export default router;
