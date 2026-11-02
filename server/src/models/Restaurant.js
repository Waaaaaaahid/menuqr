import mongoose from 'mongoose';
import slugify from 'slugify';

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    logo: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    cuisine: {
      type: [String],
      default: ['Multi-Cuisine'],
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: 'USA' },
    },
    phone: {
      type: String,
      default: '',
    },
    googleReviewUrl: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
    },
    currency: {
      symbol: { type: String, default: '$' },
      code: { type: String, default: 'USD' },
      position: { type: String, enum: ['before', 'after'], default: 'before' },
    },
    openingHours: {
      type: String,
      default: 'Mon - Sun: 10:00 AM - 11:00 PM',
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    tableOrderingEnabled: {
      type: Boolean,
      default: true,
    },
    taxPercentage: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    serviceChargePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    announcement: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug before saving if not present
restaurantSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;
