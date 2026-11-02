import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import { ensureSampleMenuForRestaurant } from './sampleMenuController.js';

// @desc    Get all categories for the owner's restaurant
// @route   GET /api/categories
// @access  Private (Owner)
export const getCategories = async (req, res, next) => {
  try {
    // Seed the first menu before returning categories to the dashboard.
    await ensureSampleMenuForRestaurant(req.restaurant);

    const categories = await Category.find({ restaurant: req.restaurant._id }).sort({
      displayOrder: 1,
      createdAt: 1,
    });

    // Count items per category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const itemCount = await MenuItem.countDocuments({
          restaurant: req.restaurant._id,
          category: cat._id,
        });
        return {
          ...cat.toObject(),
          itemCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      categories: categoriesWithCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private (Owner)
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, displayOrder, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    // Check duplicate name within this restaurant
    const existing = await Category.findOne({
      restaurant: req.restaurant._id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists',
      });
    }

    // If displayOrder not provided, append to the end
    let order = displayOrder;
    if (order === undefined) {
      const highestOrder = await Category.findOne({ restaurant: req.restaurant._id })
        .sort('-displayOrder')
        .select('displayOrder');
      order = highestOrder ? highestOrder.displayOrder + 1 : 1;
    }

    const category = await Category.create({
      restaurant: req.restaurant._id,
      name: name.trim(),
      description: description || '',
      image: image || '',
      displayOrder: order,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    res.status(201).json({
      success: true,
      category,
      message: 'Category created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (Owner)
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      restaurant: req.restaurant._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const { name, description, image, displayOrder, isActive } = req.body;

    if (name && name.trim() !== category.name) {
      // Check duplicate
      const duplicate = await Category.findOne({
        restaurant: req.restaurant._id,
        _id: { $ne: category._id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Another category with this name already exists',
        });
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    res.status(200).json({
      success: true,
      category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Owner)
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      restaurant: req.restaurant._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if items are in this category
    const itemCount = await MenuItem.countDocuments({
      restaurant: req.restaurant._id,
      category: category._id,
    });

    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It currently contains ${itemCount} food item(s). Please reassign or delete the items first.`,
      });
    }

    await Category.deleteOne({ _id: category._id });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder categories
// @route   PUT /api/categories/reorder
// @access  Private (Owner)
export const reorderCategories = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({
        success: false,
        message: 'orderedIds array is required',
      });
    }

    const updates = orderedIds.map((id, index) =>
      Category.updateOne(
        { _id: id, restaurant: req.restaurant._id },
        { displayOrder: index + 1 }
      )
    );

    await Promise.all(updates);

    const categories = await Category.find({ restaurant: req.restaurant._id }).sort('displayOrder');

    res.status(200).json({
      success: true,
      categories,
      message: 'Categories reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};
