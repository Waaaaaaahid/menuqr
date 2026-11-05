import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  PackageCheck,
  XCircle,
  ArrowLeft,
  Store,
  QrCode,
  Sparkles,
  Star,
} from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { formatCurrency, formatRelativeTime, getOrderStatusInfo } from '../../utils/formatters';
import { DietaryBadge } from '../../components/common/Badge';
import { saveCustomerActiveOrder, clearCustomerActiveOrder, isCustomerOrderActive } from '../../utils/customerOrders';
import { playCustomerReadyChime, unlockNotificationAudio } from '../../utils/notificationSounds';
import FoodLoading from '../../components/common/FoodLoading';

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const { socket, joinOrderRoom } = useSocket();

  const [order, setOrder] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clockNow, setClockNow] = useState(Date.now());
  const previousStatusRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/public/orders/${orderId}`);
        if (res.data.success) {
          setOrder(res.data.order);
          previousStatusRef.current = res.data.order.status;
          setRestaurant(res.data.restaurant);
          if (isCustomerOrderActive(res.data.order.status)) {
            saveCustomerActiveOrder(res.data.restaurant.slug, {
              orderId: res.data.order._id,
              orderNumber: res.data.order.orderNumber || '',
              restaurantSlug: res.data.restaurant.slug,
              restaurantName: res.data.restaurant.name,
              tableNumber: res.data.order.table?.tableNumber || '',
              tableToken: res.data.order.table?.qrToken || '',
              status: res.data.order.status,
              savedAt: new Date().toISOString(),
            });
          } else {
            clearCustomerActiveOrder(res.data.restaurant.slug, res.data.order._id, res.data.order.table?.tableNumber || '');
          }
        }
      } catch (err) {
        setError('Order not found or has expired.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
      joinOrderRoom(orderId);
    }
  }, [orderId]);

  // Unlock audio after the customer's first tap/click/key press; browsers block unsolicited autoplay.
  useEffect(() => {
    const unlock = () => { unlockNotificationAudio(); };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Real-time socket listener for live order progression
  useEffect(() => {
    if (!socket || !orderId) return;

    joinOrderRoom(orderId);

    const handleStatusUpdate = (updatedOrder) => {
      if (updatedOrder._id === orderId) {
        if (updatedOrder.status === 'ready' && previousStatusRef.current !== 'ready') {
          playCustomerReadyChime();
        }
        previousStatusRef.current = updatedOrder.status;
        setOrder(updatedOrder);
        if (restaurant?.slug && isCustomerOrderActive(updatedOrder.status)) {
          saveCustomerActiveOrder(restaurant.slug, {
            orderId: updatedOrder._id,
            orderNumber: updatedOrder.orderNumber || '',
            restaurantSlug: restaurant.slug,
            restaurantName: restaurant.name,
            tableNumber: updatedOrder.table?.tableNumber || '',
            tableToken: updatedOrder.table?.qrToken || '',
            status: updatedOrder.status,
            savedAt: new Date().toISOString(),
          });
        } else if (restaurant?.slug) {
          clearCustomerActiveOrder(restaurant.slug, updatedOrder._id, updatedOrder.table?.tableNumber || '');
        }
      }
    };

    socket.on('customer_order_status', handleStatusUpdate);

    return () => {
      socket.off('customer_order_status', handleStatusUpdate);
    };
  }, [socket, orderId, restaurant?.slug]);

  if (loading) {
    return (
      <FoodLoading message="Tracking your table order" />
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'pending', label: 'Order Placed', desc: 'Sent to restaurant kitchen', icon: Clock },
    { key: 'accepted', label: 'Accepted', desc: 'Kitchen acknowledged order', icon: CheckCircle2 },
    { key: 'preparing', label: 'Cooking', desc: 'Chef is crafting your dishes', icon: ChefHat },
    { key: 'ready', label: 'Ready for Table', desc: 'Plated and ready to be served', icon: PackageCheck },
    { key: 'completed', label: 'Served', desc: 'Your order has been served. Enjoy your meal!', icon: Sparkles },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'pending': return 0;
      case 'accepted': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'completed': return 4;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const timerSeconds = order.prepPausedAt ? (order.prepRemainingSeconds || 0) : order.prepEndsAt ? Math.max(0, Math.ceil((new Date(order.prepEndsAt).getTime() - clockNow) / 1000)) : (order.prepRemainingSeconds || 0);
  const timerText = `${Math.floor(timerSeconds / 60)}:${String(timerSeconds % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          {restaurant?.slug && (
            <Link
              to={`/orders/${restaurant.slug}?table=${encodeURIComponent(order.table?.tableNumber || '')}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Orders</span>
            </Link>
          )}
          <span className="text-xs font-bold text-slate-400">{order.status === 'completed' ? 'Order Served' : 'Live Status Tracker'}</span>
        </div>

        {/* Live Status Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                {restaurant?.name || 'Restaurant'}
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {order.orderNumber}
              </h1>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-extrabold text-xs">
                {order.table?.tableNumber || 'Table'}
              </span>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                {formatRelativeTime(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Cancellation Notice if Cancelled */}
          {isCancelled ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-sm">Order Cancelled</h3>
                <p className="text-xs text-rose-600 mt-0.5">
                  This order was cancelled by the restaurant. Please check with your server.
                </p>
              </div>
            </div>
          ) : order.status === 'completed' ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Order completed</p>
              <h2 className="text-xl font-black text-emerald-950">Your order has been served!</h2>
              <p className="text-xs text-emerald-800">Enjoy your meal. We hope to see you again soon.</p>
            </div>
          ) : (
            /* Live Progress Timeline */
            <div className="space-y-6">
              <div className="flex items-center justify-between relative">
                {/* Horizontal progress bar track */}
                <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-100 -z-0">
                  <div
                    className="h-full bg-brand-500 transition-all duration-500"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                  />
                </div>

                {steps.map((st, idx) => {
                  const Icon = st.icon;
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={st.key} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                            : 'bg-white text-slate-300 border-2 border-slate-200'
                        } ${isCurrent ? 'ring-4 ring-brand-500/20 scale-110' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] font-bold mt-2 text-center whitespace-nowrap ${
                          isDone ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Status Banner Message */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-500/10 via-amber-500/10 to-brand-500/10 border border-brand-200/60 text-slate-900 text-center space-y-1">
                <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                  Current Kitchen Progress
                </p>
                <p className="text-sm font-black text-slate-900">
                  {steps[currentStep]?.label}: {steps[currentStep]?.desc}
                </p>
                <p className="text-[11px] text-slate-500">
                  This page updates live automatically without refreshing.
                </p>
              </div>
            </div>
          )}

          {order.prepStartedAt && !isCancelled && !['ready', 'completed'].includes(order.status) && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Estimated preparation time</p>
              <p className="text-4xl font-black tabular-nums text-indigo-950">{order.prepPausedAt ? 'Paused' : timerText}</p>
              <p className="text-xs text-indigo-700">{order.prepPausedAt ? 'The kitchen timer is temporarily paused.' : 'Live countdown — the restaurant can adjust this estimate.'}</p>
            </div>
          )}

          {/* Itemized Order Summary */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Order Receipt
            </h3>

            <div className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-start justify-between text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-extrabold text-slate-900 min-w-[20px]">
                      {item.quantity}×
                    </span>
                    <DietaryBadge isVeg={item.isVeg} className="mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      {item.specialInstructions && (
                        <p className="text-[11px] text-brand-600 italic">
                          "{item.specialInstructions}"
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(item.price * item.quantity, restaurant?.currency)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill Math */}
            <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal, restaurant?.currency)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({restaurant?.taxPercentage || 0}%)</span>
                  <span>{formatCurrency(order.tax, restaurant?.currency)}</span>
                </div>
              )}
              {order.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge</span>
                  <span>{formatCurrency(order.serviceCharge, restaurant?.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-100">
                <span>Total Bill</span>
                <span className="text-brand-600">
                  {formatCurrency(order.totalAmount, restaurant?.currency)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] pt-1">
                <span>Payment Method</span>
                <span className="font-bold text-slate-700">Pay at Counter (Cash)</span>
              </div>
            </div>
          </div>

          {/* Google review prompt appears only after the order is served. */}
          {order.status === 'completed' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Enjoyed your experience?</h3>
                <p className="text-xs text-slate-600 mt-1">Your honest feedback helps {restaurant?.name || 'us'} serve you better.</p>
              </div>
              {restaurant?.googleReviewUrl ? (
                <a href={restaurant.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Write a Google Review
                </a>
              ) : (
                <p className="text-[11px] text-amber-800">Google review link has not been added by the restaurant yet.</p>
              )}
              <p className="text-[10px] text-slate-500">Please share your honest experience. Reviews are always optional.</p>
            </div>
          )}

          {/* Action to Order More */}
          {restaurant?.slug && (
            <div className="pt-2">
              <Link
                to={`/menu/${restaurant.slug}?table=${encodeURIComponent(order.table?.tableNumber || '')}&key=${encodeURIComponent(order.table?.qrToken || '')}${order.status === 'completed' ? '' : '&browse=1'}`}
                onClick={() => { if (order.status === 'completed') clearCustomerActiveOrder(restaurant.slug, order._id, order.table?.tableNumber || ''); }}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>{order.status === 'completed' ? 'Order Again' : 'Add More Dishes to Table'}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
