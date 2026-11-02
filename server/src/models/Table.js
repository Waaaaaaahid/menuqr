import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    qrToken: { type: String, default: '', index: true },
    tableNumber: {
      type: String,
      required: [true, 'Table number or identifier is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      default: 4,
      min: 1,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved'],
      default: 'available',
    },
    qrCodeDataUrl: {
      type: String,
      default: '',
    },
    qrCodeSvg: {
      type: String,
      default: '',
    },
    activeOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    session: {
      status: { type: String, enum: ['none', 'pending', 'active'], default: 'none' },
      customerName: { type: String, default: '' },
      otpHash: { type: String, default: '' },
      tokenHash: { type: String, default: '' },
      expiresAt: { type: Date, default: null },
      requestedAt: { type: Date, default: null },
      verifiedAt: { type: Date, default: null },
      attempts: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

tableSchema.index({ restaurant: 1, tableNumber: 1 }, { unique: true });

const Table = mongoose.model('Table', tableSchema);
export default Table;
