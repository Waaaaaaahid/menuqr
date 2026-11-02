import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plan: { type: String, enum: ['free', 'normal', 'medium', 'pro'], required: true },
  razorpaySubscriptionId: { type: String, index: true, sparse: true },
  razorpayPlanId: { type: String, default: '' },
  status: { type: String, enum: ['created', 'authenticated', 'active', 'halted', 'cancelled', 'completed', 'expired', 'free'], default: 'created' },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  currentStart: Date,
  currentEnd: Date,
  endedAt: Date,
}, { timestamps: true });

subscriptionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Subscription', subscriptionSchema);
