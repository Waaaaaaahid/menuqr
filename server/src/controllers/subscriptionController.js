import crypto from 'crypto';
import Subscription from '../models/Subscription.js';

const PLAN_CONFIG = () => ({
  basic: { name: 'Basic', amount: Number(process.env.MENUQR_BASIC_AMOUNT_CENTS || 900), currency: 'USD', billing: 'monthly', features: ['Digital menu', 'QR codes for tables', 'Live order dashboard', 'Menu and price management'] },
  pro: { name: 'Pro', amount: Number(process.env.MENUQR_PRO_AMOUNT_CENTS || 1900), currency: 'USD', billing: 'monthly', features: ['Everything in Basic', 'Unlimited tables and menu items', 'Kitchen order notifications', 'Advanced analytics', 'Priority support', 'Custom branding'] },
  lifetime: { name: 'Lifetime', amount: Number(process.env.MENUQR_LIFETIME_AMOUNT_CENTS || 29900), currency: 'USD', billing: 'one-time', features: ['Everything in Pro', 'One-time payment', 'Lifetime access'] },
});

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const error = new Error('Razorpay is not configured yet. Add your Razorpay credentials to the backend environment.');
    error.statusCode = 503;
    throw error;
  }
};

const razorpayRequest = async (endpoint, method = 'GET', body) => {
  getRazorpay();
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1/${endpoint}`, {
    method, headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error?.description || 'Razorpay API request failed.');
    error.statusCode = response.status;
    throw error;
  }
  return data;
};

export const getPlans = (req, res) => {
  res.json({ success: true, plans: Object.entries(PLAN_CONFIG()).map(([id, plan]) => ({
    id, name: plan.name, amount: plan.amount, price: plan.amount / 100,
    currency: plan.currency, billing: plan.billing, interval: plan.billing === 'monthly' ? 'monthly' : 'one-time', features: plan.features,
  })) });
};

export const createCheckout = async (req, res, next) => {
  try {
    const { plan: planKey } = req.body;
    const config = PLAN_CONFIG()[planKey];
    if (!config) return res.status(400).json({ success: false, message: 'Please select a valid plan.' });
    getRazorpay();

    // Lifetime is a one-time order; Basic and Pro are recurring monthly subscriptions.
    if (planKey === 'lifetime') {
      const order = await razorpayRequest('orders', 'POST', {
        amount: config.amount, currency: config.currency, receipt: `menuqr_${String(req.user._id).slice(-10)}_${Date.now()}`,
        notes: { userId: String(req.user._id), plan: planKey, product: 'MenuQR' },
      });
      await Subscription.create({
        user: req.user._id, plan: planKey, razorpayOrderId: order.id,
        status: 'created', amount: config.amount, currency: config.currency,
      });
      return res.status(201).json({
        success: true, keyId: process.env.RAZORPAY_KEY_ID, orderId: order.id,
        amount: config.amount, currency: config.currency, billing: 'one-time',
        prefill: { name: req.user.name, email: req.user.email },
      });
    }

    let planRecord = await Subscription.db.collection('razorpayplans').findOne({ planKey, currency: config.currency });
    let razorpayPlanId = planRecord?.razorpayPlanId;
    if (!razorpayPlanId) {
      const createdPlan = await razorpayRequest('plans', 'POST', {
        period: 'monthly', interval: 1,
        item: { name: `MenuQR ${config.name} Monthly`, amount: config.amount, currency: config.currency, description: `MenuQR ${config.name} monthly subscription` },
      });
      razorpayPlanId = createdPlan.id;
      await Subscription.db.collection('razorpayplans').updateOne(
        { planKey, currency: config.currency },
        { $set: { planKey, currency: config.currency, razorpayPlanId, amount: config.amount, updatedAt: new Date() } }, { upsert: true }
      );
    }
    const created = await razorpayRequest('subscriptions', 'POST', {
      plan_id: razorpayPlanId, total_count: 120, quantity: 1, customer_notify: 1,
      notes: { userId: String(req.user._id), plan: planKey, product: 'MenuQR' },
    });
    await Subscription.create({
      user: req.user._id, plan: planKey, razorpaySubscriptionId: created.id,
      razorpayPlanId, status: created.status || 'created', amount: config.amount, currency: config.currency,
    });
    return res.status(201).json({
      success: true, keyId: process.env.RAZORPAY_KEY_ID, subscriptionId: created.id,
      plan: { id: planKey, name: config.name, amount: config.amount, currency: config.currency },
      billing: 'monthly', prefill: { name: req.user.name, email: req.user.email },
    });
  } catch (error) { next(error); }
};

export const verifyCheckout = async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_order_id, razorpay_signature } = req.body;
    if (!razorpay_payment_id || !razorpay_signature || (!razorpay_subscription_id && !razorpay_order_id)) {
      return res.status(400).json({ success: false, message: 'Payment verification details are incomplete.' });
    }
    const paymentRef = razorpay_subscription_id || razorpay_order_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id ? razorpay_order_id : razorpay_payment_id}|${razorpay_order_id ? razorpay_payment_id : razorpay_subscription_id}`)
      .digest('hex');
    const a = Buffer.from(expected), b = Buffer.from(String(razorpay_signature));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }
    const query = razorpay_order_id
      ? { user: req.user._id, razorpayOrderId: razorpay_order_id, plan: 'lifetime' }
      : { user: req.user._id, razorpaySubscriptionId: razorpay_subscription_id };
    const record = await Subscription.findOne(query);
    if (!record) return res.status(404).json({ success: false, message: 'Payment record not found.' });
    record.status = razorpay_order_id ? 'active' : 'authenticated';
    if (razorpay_payment_id) record.razorpayPaymentId = razorpay_payment_id;
    await record.save();
    return res.json({ success: true, message: razorpay_order_id ? 'Lifetime payment verified and activated.' : 'Payment verified. Subscription activation will reflect shortly.', subscription: record });
  } catch (error) { next(error); }
};

export const handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ success: false, message: 'Webhook secret is not configured.' });
  const signature = req.headers['x-razorpay-signature'];
  const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(String(signature || ''));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(400).send('Invalid webhook signature');
  try {
    const event = JSON.parse(req.body.toString('utf8'));
    const entity = event.payload?.subscription?.entity;
    if (entity?.id) {
      const statusMap = {
        'subscription.activated': 'active', 'subscription.charged': 'active',
        'subscription.authenticated': 'authenticated', 'subscription.halted': 'halted',
        'subscription.cancelled': 'cancelled', 'subscription.completed': 'completed',
        'subscription.paused': 'halted', 'subscription.resumed': 'active',
      };
      const status = statusMap[event.event];
      if (status) await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: entity.id },
        { $set: { status, currentStart: entity.current_start ? new Date(entity.current_start * 1000) : undefined, currentEnd: entity.current_end ? new Date(entity.current_end * 1000) : undefined, endedAt: entity.ended_at ? new Date(entity.ended_at * 1000) : undefined } }
      );
    }
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.order_id;
      if (orderId) await Subscription.findOneAndUpdate(
        { razorpayOrderId: orderId, plan: 'lifetime' },
        { $set: { status: 'active', razorpayPaymentId: payment.id } }
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
