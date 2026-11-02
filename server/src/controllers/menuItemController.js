import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import { ensureSampleMenuForRestaurant } from './sampleMenuController.js';

// @desc    Get all menu items for owner's restaurant
// @route   GET /api/menu-items
// @access  Private (Owner)
export const getMenuItems = async (req, res, next) => {
  try {
    const { category, search, isVeg, isAvailable, isBestseller } = req.query;

    // Ensure the owner's first visit has a menu to manage.
    await ensureSampleMenuForRestaurant(req.restaurant);

    const query = { restaurant: req.restaurant._id };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (isVeg !== undefined) {
      query.isVeg = isVeg === 'true';
    }

    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    if (isBestseller !== undefined) {
      query.isBestseller = isBestseller === 'true';
    }

    const items = await MenuItem.find(query)
      .populate('category', 'name displayOrder')
      .sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single menu item by ID
// @route   GET /api/menu-items/:id
// @access  Private (Owner)
export const getMenuItemById = async (req, res, next) => {
  try {
    const item = await MenuItem.findOne({
      _id: req.params.id,
      restaurant: req.restaurant._id,
    }).populate('category', 'name');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create menu item
// @route   POST /api/menu-items
// @access  Private (Owner)
export const createMenuItem = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      isVeg,
      isPopular,
      isBestseller,
      isSpicy,
      spiceLevel,
      isNewItem,
      isAvailable,
      preparationTime,
      displayOrder,
    } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, price, and category',
      });
    }

    // Verify category belongs to this restaurant
    const categoryDoc = await Category.findOne({
      _id: category,
      restaurant: req.restaurant._id,
    });

    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category selected',
      });
    }

    const item = await MenuItem.create({
      restaurant: req.restaurant._id,
      category,
      name: name.trim(),
      description: description || '',
      price: Number(price),
      image: image || '',
      isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
      isPopular: Boolean(isPopular),
      isBestseller: Boolean(isBestseller),
      isSpicy: Boolean(isSpicy),
      spiceLevel: spiceLevel ? Number(spiceLevel) : 0,
      isNewItem: Boolean(isNewItem),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      preparationTime: preparationTime || '15-20 min',
      displayOrder: displayOrder ? Number(displayOrder) : 0,
    });

    const populatedItem = await item.populate('category', 'name');

    res.status(201).json({
      success: true,
      item: populatedItem,
      message: 'Menu item created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update menu item
// @route   PUT /api/menu-items/:id
// @access  Private (Owner)
export const updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findOne({
      _id: req.params.id,
      restaurant: req.restaurant._id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    const {
      name,
      description,
      price,
      category,
      image,
      isVeg,
      isPopular,
      isBestseller,
      isSpicy,
      spiceLevel,
      isNewItem,
      isAvailable,
      preparationTime,
      displayOrder,
    } = req.body;

    if (category && category !== item.category.toString()) {
      const categoryDoc = await Category.findOne({
        _id: category,
        restaurant: req.restaurant._id,
      });
      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category selected',
        });
      }
      item.category = category;
    }

    if (name !== undefined) item.name = name.trim();
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = Number(price);
    if (image !== undefined) item.image = image;
    if (isVeg !== undefined) item.isVeg = Boolean(isVeg);
    if (isPopular !== undefined) item.isPopular = Boolean(isPopular);
    if (isBestseller !== undefined) item.isBestseller = Boolean(isBestseller);
    if (isSpicy !== undefined) item.isSpicy = Boolean(isSpicy);
    if (spiceLevel !== undefined) item.spiceLevel = Number(spiceLevel);
    if (isNewItem !== undefined) item.isNewItem = Boolean(isNewItem);
    if (isAvailable !== undefined) item.isAvailable = Boolean(isAvailable);
    if (preparationTime !== undefined) item.preparationTime = preparationTime;
    if (displayOrder !== undefined) item.displayOrder = Number(displayOrder);

    await item.save();

    const populatedItem = await item.populate('category', 'name');

    res.status(200).json({
      success: true,
      item: populatedItem,
      message: 'Menu item updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle item availability
// @route   PATCH /api/menu-items/:id/toggle-availability
// @access  Private (Owner)
export const toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findOne({
      _id: req.params.id,
      restaurant: req.restaurant._id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.status(200).json({
      success: true,
      isAvailable: item.isAvailable,
      message: `Dish marked as ${item.isAvailable ? 'available' : 'unavailable'}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu-items/:id
// @access  Private (Owner)
export const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findOne({
      _id: req.params.id,
      restaurant: req.restaurant._id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    await MenuItem.deleteOne({ _id: item._id });

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
