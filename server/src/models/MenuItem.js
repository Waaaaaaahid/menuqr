import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select a category'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Dish name is required'],
      trim: true,
      maxlength: [100, 'Dish name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    sizeOptions: [{
      name: { type: String, required: true, trim: true },
      price: { type: Number, required: true, min: 0 },
    }],
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    image: {
      type: String,
      default: '',
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
    isSpicy: {
      type: Boolean,
      default: false,
    },
    spiceLevel: {
      type: Number,
      enum: [0, 1, 2, 3], // 0: None, 1: Mild, 2: Medium, 3: Hot
      default: 0,
    },
    isNewItem: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: String,
      default: '15-20 min',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
