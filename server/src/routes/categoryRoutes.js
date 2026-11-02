import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '../controllers/categoryController.js';
import { importSampleMenu } from '../controllers/sampleMenuController.js';
import { protect } from '../middleware/auth.js';
import { requireRestaurant } from '../middleware/restaurantAuth.js';

const router = express.Router();

// Apply auth & restaurant ownership verification to all routes
router.use(protect, requireRestaurant);

router.route('/').get(getCategories).post(createCategory);
router.post('/import-sample-menu', importSampleMenu);
router.put('/reorder', reorderCategories);
router.route('/:id').put(updateCategory).delete(deleteCategory);

export default router;
