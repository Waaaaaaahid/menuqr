import crypto from 'crypto';
import Razorpay from 'razorpay';
import Subscription from '../models/Subscription.js';

const PLAN_CONFIG = {
  free: { name: 'Free', amount: 0, features: ['Digital menu', 'QR code for up to 5 tables', 'Up to 25 menu items'] },
  normal: { name: 'Normal', amount: Number(process.env.MENUQR_NORMAL_AMOUNT_PAISE || 29900), features: ['Everything in Free', 'Live order dashboard', 'Up to 10 tables'] },
  medium: { name: 'Medium', amount: Number(process.env.MENUQR_MEDIUM_AMOUNT_PAISE || 59900), features: ['Everything in Normal', 'Unlimited tables', 'Kitchen order notifications', 'Basic analytics'] },
  pro: { name: 'Pro', amount: Number(process.env.MENUQR_PRO_AMOUNT_PAISE || 99900), features: ['Everything in Medium', 'Advanced analytics', 'Priority support', 'Custom branding'] },
};

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const error = new Error('Razorpay is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend environment.');
    error.statusCode = 503;
    throw error;
  }
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

export const getPlans = (req, res) => {
  res.json({
    success: true,
    plans: Object.entries(PLAN_CONFIG).map(([id, plan]) => ({
      id, name: plan.name, amount: plan.amount, currency: 'INR',
      price: plan.amount / 100, interval: 'monthly', features: plan.features,
    })),
  });
};

export const createCheckout = async (req, res, next) => {
  try {
    const { plan: planKey } = req.body;
    const config = PLAN_CONFIG[planKey];
    if (!config) return res.status(400).json({ success: false, message: 'Please select a valid subscription plan.' });

    if (planKey === 'free') {
      const subscription = await Subscription.create({
        user: req.user._id, plan: 'free', status: 'free', amount: 0, currency: 'INR',
      });
      return res.json({ success: true, free: true, subscription });
    }

    const razorpay = getRazorpay();
    // Razorpay Plans are created once and reused for future subscribers.
    let planRecord = await Subscription.db.collection('razorpayplans').findOne({ planKey });
    let razorpayPlanId = planRecord?.razorpayPlanId;
    if (!razorpayPlanId) {
      const createdPlan = await razorpay.plans.create({
        period: 'monthly',
        interval: 1,
        item: { name: `MenuQR ${config.name} Monthly`, amount: config.amount, currency: 'INR', description: `MenuQR ${config.name} subscription` },
      });
      razorpayPlanId = createdPlan.id;
      await Subscription.db.collection('razorpayplans').updateOne(
        { planKey }, { $set: { planKey, razorpayPlanId, amount: config.amount, updatedAt: new Date() } }, { upsert: true }
      );
    }

    const created = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: { userId: String(req.user._id), plan: planKey, product: 'MenuQR' },
    });

    await Subscription.create({
      user: req.user._id, plan: planKey, razorpaySubscriptionId: created.id,
      razorpayPlanId, status: created.status || 'created',
      amount: config.amount, currency: 'INR',
    });

    res.status(201).json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionId: created.id,
      plan: { id: planKey, name: config.name, amount: config.amount, currency: 'INR' },
      prefill: { name: req.user.name, email: req.user.email },
    });
  } catch (error) { next(error); }
};

export const verifyCheckout = async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification details are incomplete.' });
    }
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(String(razorpay_signature));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }

    const subscription = await Subscription.findOne({
      user: req.user._id, razorpaySubscriptionId: razorpay_subscription_id,
    });
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription record not found.' });

    subscription.status = 'authenticated';
    await subscription.save();
    res.json({ success: true, message: 'Payment verified. Your subscription is being activated.', subscription });
  } catch (error) { next(error); }
};

export const handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ success: false, message: 'Webhook secret is not configured.' });
  const signature = req.headers['x-razorpay-signature'];
  const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(400).send('Invalid webhook signature');

  try {
    const event = JSON.parse(req.body.toString('utf8'));
    const entity = event.payload?.subscription?.entity;
    if (entity?.id) {
      const statusMap = {
        'subscription.activated': 'active',
        'subscription.charged': 'active',
        'subscription.authenticated': 'authenticated',
        'subscription.halted': 'halted',
        'subscription.cancelled': 'cancelled',
        'subscription.completed': 'completed',
        'subscription.paused': 'halted',
        'subscription.resumed': 'active',
      };
      const status = statusMap[event.event];
      if (status) await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: entity.id },
        { $set: { status, currentStart: entity.current_start ? new Date(entity.current_start * 1000) : undefined, currentEnd: entity.current_end ? new Date(entity.current_end * 1000) : undefined, endedAt: entity.ended_at ? new Date(entity.ended_at * 1000) : undefined } }
      );
    }
    return res.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook processing failed:', error.message);
    return res.status(400).json({ success: false });
  }
};

export const getMySubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, subscription });
  } catch (error) { next(error); }
};
