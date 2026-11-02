import slugify from 'slugify';
import { randomBytes } from 'crypto';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';
import { processUploadedFile } from '../middleware/upload.js';
import { generateTableQRCode } from '../utils/qrGenerator.js';

// Helper to generate unique slug
const generateUniqueSlug = async (name) => {
  let baseSlug = slugify(name, { lower: true, strict: true }) || 'restaurant';
  let slug = baseSlug;
  let counter = 1;

  while (await Restaurant.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

// @desc    Setup / Create new restaurant
// @route   POST /api/restaurant
// @access  Private
export const createRestaurant = async (req, res, next) => {
  try {
    const {
      name,
      description,
      cuisine,
      address,
      phone,
      email,
      currency,
      openingHours,
      taxPercentage,
      serviceChargePercentage,
      logo,
      coverImage,
      googleReviewUrl,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant name is required',
      });
    }

    // Check if user already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ owner: req.user._id });
    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active restaurant profile',
        restaurant: existingRestaurant,
      });
    }

    const slug = await generateUniqueSlug(name);

    const restaurant = await Restaurant.create({
      name,
      slug,
      owner: req.user._id,
      description: description || '',
      cuisine: Array.isArray(cuisine)
        ? cuisine
        : typeof cuisine === 'string'
        ? cuisine.split(',').map((c) => c.trim()).filter(Boolean)
        : ['Multi-Cuisine'],
      address: address || {},
      phone: phone || '',
      email: email || req.user.email,
      currency: currency || { symbol: '$', code: 'USD', position: 'before' },
      openingHours: openingHours || 'Mon - Sun: 10:00 AM - 11:00 PM',
      taxPercentage: taxPercentage !== undefined ? Number(taxPercentage) : 5,
      serviceChargePercentage:
        serviceChargePercentage !== undefined ? Number(serviceChargePercentage) : 0,
      logo: logo || '',
      coverImage: coverImage || '',
    });

    // Update user's restaurant reference
    await User.findByIdAndUpdate(req.user._id, { restaurant: restaurant._id });

    // Seed default starter categories and Table 1
    const defaultCategories = [
      { name: 'Starters & Appetizers', displayOrder: 1 },
      { name: 'Main Course', displayOrder: 2 },
      { name: 'Beverages', displayOrder: 3 },
      { name: 'Desserts', displayOrder: 4 },
    ];

    for (const cat of defaultCategories) {
      await Category.create({
        restaurant: restaurant._id,
        name: cat.name,
        displayOrder: cat.displayOrder,
      });
    }

    // Create Table 1 with QR Code
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const qrToken = randomBytes(24).toString('hex');
    const qrInfo = await generateTableQRCode(clientBaseUrl, restaurant.slug, 'T-01', qrToken);

    await Table.create({
      restaurant: restaurant._id,
      tableNumber: 'T-01',
      qrToken,
      capacity: 4,
      status: 'available',
      qrCodeDataUrl: qrInfo.qrCodeDataUrl,
      qrCodeSvg: qrInfo.qrCodeSvg,
    });

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's restaurant details
// @route   GET /api/restaurant/me
// @access  Private (Owner)
export const getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        needsSetup: true,
        message: 'No restaurant found. Please create one.',
      });
    }

    res.status(200).json({
      success: true,
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant details
// @route   PUT /api/restaurant/me
// @access  Private (Owner)
export const updateMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    const {
      name,
      description,
      cuisine,
      address,
      phone,
      email,
      currency,
      openingHours,
      isOpen,
      tableOrderingEnabled,
      taxPercentage,
      serviceChargePercentage,
      announcement,
      logo,
      coverImage,
      googleReviewUrl,
    } = req.body;

    if (name && name !== restaurant.name) {
      restaurant.name = name;
      restaurant.slug = await generateUniqueSlug(name);
    }

    if (description !== undefined) restaurant.description = description;
    if (cuisine !== undefined) {
      restaurant.cuisine = Array.isArray(cuisine)
        ? cuisine
        : typeof cuisine === 'string'
        ? cuisine.split(',').map((c) => c.trim()).filter(Boolean)
        : restaurant.cuisine;
    }
    if (address !== undefined) restaurant.address = { ...restaurant.address, ...address };
    if (phone !== undefined) restaurant.phone = phone;
    if (email !== undefined) restaurant.email = email;
    if (currency !== undefined) restaurant.currency = { ...restaurant.currency, ...currency };
    if (openingHours !== undefined) restaurant.openingHours = openingHours;
    if (isOpen !== undefined) restaurant.isOpen = Boolean(isOpen);
    if (tableOrderingEnabled !== undefined) restaurant.tableOrderingEnabled = Boolean(tableOrderingEnabled);
    if (taxPercentage !== undefined) restaurant.taxPercentage = Number(taxPercentage);
    if (serviceChargePercentage !== undefined)
      restaurant.serviceChargePercentage = Number(serviceChargePercentage);
    if (announcement !== undefined) restaurant.announcement = announcement;
    if (logo !== undefined) restaurant.logo = logo;
    if (coverImage !== undefined) restaurant.coverImage = coverImage;
    if (googleReviewUrl !== undefined) restaurant.googleReviewUrl = googleReviewUrl;

    await restaurant.save();

    res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully',
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload media (logo or cover image)
// @route   POST /api/restaurant/upload
// @access  Private (Owner)
export const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded',
      });
    }

    const url = await processUploadedFile(req.file);

    res.status(200).json({
      success: true,
      url,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public restaurant menu by slug
// @route   GET /api/public/menu/:slug
// @access  Public
export const getPublicMenu = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { table: tableParam, key: tableKey } = req.query;

    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // A public menu session must originate from a table's QR code.
    if (!tableParam || !tableKey) return res.status(403).json({ success: false, message: 'Please scan the QR code placed on your table to open this menu.' });
    let tableInfo = null;
    if (tableParam && tableKey) {
      tableInfo = await Table.findOne({
        restaurant: restaurant._id,
        tableNumber: tableParam,
        qrToken: tableKey,
      });
      if (!tableInfo) return res.status(403).json({ success: false, message: 'Invalid table QR code. Please scan the QR displayed on your table.' });
    }

    // Keep the customer-facing request read-only and fast. Sample/demo menu
    // creation belongs in the owner setup flow, never on a customer's QR scan.
    // Fetch categories and dishes together to avoid serial database round trips.
    const [categories, menuItems] = await Promise.all([
      Category.find({
        restaurant: restaurant._id,
        isActive: true,
      })
        .sort({ displayOrder: 1, name: 1 })
        .lean(),
      MenuItem.find({
        restaurant: restaurant._id,
        isAvailable: true,
      })
        .populate('category', 'name displayOrder')
        .sort({ displayOrder: 1, name: 1 })
        .lean(),
    ]);

    // A short private browser cache makes repeat QR visits feel instant while
    // ensuring one customer's table details are never shared with another.
    res.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');

    res.status(200).json({
      success: true,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        cuisine: restaurant.cuisine,
        logo: restaurant.logo,
        coverImage: restaurant.coverImage,
        address: restaurant.address,
        phone: restaurant.phone,
        currency: restaurant.currency,
        openingHours: restaurant.openingHours,
        isOpen: restaurant.isOpen,
        tableOrderingEnabled: restaurant.tableOrderingEnabled,
        taxPercentage: restaurant.taxPercentage,
        serviceChargePercentage: restaurant.serviceChargePercentage,
        announcement: restaurant.announcement,
        googleReviewUrl: restaurant.googleReviewUrl,
      },
      table: tableInfo
        ? {
            id: tableInfo._id,
            tableNumber: tableInfo.tableNumber,
            capacity: tableInfo.capacity,
            status: tableInfo.status,
            qrToken: tableInfo.qrToken,
          }
        : null,
      categories,
      menuItems,
    });
  } catch (error) {
    next(error);
  }
};
