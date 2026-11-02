import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    selectedSize: { type: String, default: '' },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    specialInstructions: {
      type: String,
      default: '',
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    table: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        default: null,
      },
      tableNumber: {
        type: String,
        required: true,
      },
      qrToken: { type: String, default: '' },
    },
    customer: {
      name: {
        type: String,
        default: 'Guest',
      },
      phone: {
        type: String,
        default: '',
      },
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    prepTimeMinutes: { type: Number, default: 0, min: 0, max: 240 },
    prepStartedAt: { type: Date, default: null },
    prepEndsAt: { type: Date, default: null },
    prepPausedAt: { type: Date, default: null },
    prepRemainingSeconds: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card_at_counter', 'upi', 'online'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    specialNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ restaurant: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
