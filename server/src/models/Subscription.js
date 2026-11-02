import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plan: { type: String, enum: ['basic', 'pro', 'lifetime'], required: true },
  razorpaySubscriptionId: { type: String, index: true, sparse: true },
  razorpayPlanId: { type: String, default: '' },
  razorpayOrderId: { type: String, default: '', index: true, sparse: true },
  razorpayPaymentId: { type: String, default: '' },
  status: { type: String, enum: ['created', 'authenticated', 'active', 'halted', 'cancelled', 'completed', 'expired', 'free'], default: 'created' },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  currentStart: Date,
  currentEnd: Date,
  endedAt: Date,
}, { timestamps: true });

subscriptionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Subscription', subscriptionSchema);
