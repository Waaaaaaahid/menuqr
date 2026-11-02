import React, { useState, useEffect } from 'react';
import {
  BellRing,
  CheckCircle2,
  Clock,
  ChefHat,
  PackageCheck,
  XCircle,
  Filter,
  Volume2,
  VolumeX,
  Phone,
  User,
  AlertTriangle,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/common/Toast';
import { formatCurrency, formatRelativeTime, getOrderStatusInfo } from '../../utils/formatters';
import { DietaryBadge } from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { playAdminNewOrderBell } from '../../utils/notificationSounds';

export default function OrdersPage() {
  const { restaurant } = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, accepted, preparing, ready, completed
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [clockNow, setClockNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time Socket.IO listener for live order creation and updates
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);

      if (soundEnabled) playAdminNewOrderBell();
    };

    const handleOrderUpdate = (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_updated', handleOrderUpdate);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_updated', handleOrderUpdate);
    };
  }, [socket, soundEnabled]);

  const handleUpdateStatus = async (orderId, newStatus, prepTimeMinutes) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: newStatus, ...(prepTimeMinutes ? { prepTimeMinutes } : {}) });
      if (res.data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? res.data.order : o))
        );
        addToast(`Order updated to ${newStatus}`, 'success');
      }
    } catch (err) {
      addToast('Failed to update order status', 'error');
    }
  };

  const handleTimerUpdate = async (orderId, payload) => {
    try {
      const res = await api.put(`/orders/${orderId}/timer`, payload);
      if (res.data.success) setOrders((prev) => prev.map((o) => o._id === orderId ? res.data.order : o));
    } catch (err) { addToast(err.response?.data?.message || 'Could not update preparation timer', 'error'); }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  const getStatusCount = (st) => {
    return orders.filter((o) => o.status === st).length;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Live Kitchen & Table Orders</h2>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time kitchen order ticket (KOT) stream powered by WebSockets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title="Toggle incoming order chime"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-brand-500" /> : <VolumeX className="w-4 h-4" />}
            <span>Chime {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={fetchOrders}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {[
          { key: 'all', label: 'All Orders', count: orders.length },
          { key: 'pending', label: 'Pending', count: getStatusCount('pending'), color: 'bg-amber-500' },
          { key: 'accepted', label: 'Accepted', count: getStatusCount('accepted'), color: 'bg-blue-500' },
          { key: 'preparing', label: 'Preparing', count: getStatusCount('preparing'), color: 'bg-indigo-500' },
          { key: 'ready', label: 'Ready', count: getStatusCount('ready'), color: 'bg-emerald-500' },
          { key: 'completed', label: 'Served', count: getStatusCount('completed'), color: 'bg-slate-500' },
          { key: 'cancelled', label: 'Cancelled', count: getStatusCount('cancelled'), color: 'bg-rose-500' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                statusFilter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Grid / Cards */}
      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="No Orders Found"
          description={
            statusFilter === 'all'
              ? 'When diners scan table QR codes and place orders, they will show up here instantly with audio chimes.'
              : `There are currently no orders in "${statusFilter}" status.`
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const statusInfo = getOrderStatusInfo(order.status);
            const remaining = order.prepPausedAt ? (order.prepRemainingSeconds || 0) : order.prepEndsAt ? Math.max(0, Math.ceil((new Date(order.prepEndsAt).getTime() - clockNow) / 1000)) : (order.prepRemainingSeconds || 0);
            const timerLabel = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
            return (
              <div
                key={order._id}
                className={`bg-white rounded-2xl border transition-all shadow-card hover:shadow-dropdown flex flex-col justify-between overflow-hidden ${
                  order.status === 'pending'
                    ? 'border-amber-300 ring-2 ring-amber-400/20 shadow-glow'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">
                      {order.orderNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-extrabold text-xs">
                      {order.table?.tableNumber || 'Takeaway'}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 flex-1 space-y-4">
                  {/* Guest & Timing */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customer?.name || 'Guest'}</span>
                      {order.customer?.phone && (
                        <span className="text-slate-400">({order.customer.phone})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatRelativeTime(order.createdAt)}</span>
                    </div>
                  </div>

                  {(order.status === 'accepted' || order.status === 'preparing') && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-indigo-700">Preparation countdown</span>
                        <span className="text-xl font-black tabular-nums text-indigo-950">{timerLabel}</span>
                      </div>
                      <div className="flex gap-2">
                        <input id={`prep-${order._id}`} type="number" min="1" max="240" defaultValue={order.prepTimeMinutes || 15} className="w-24 rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-xs font-bold" aria-label="Preparation minutes" />
                        <button onClick={() => { const value = Number(document.getElementById(`prep-${order._id}`)?.value); if (value >= 1 && value <= 240) handleTimerUpdate(order._id, { minutes: value }); else addToast('Enter 1–240 minutes', 'error'); }} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white">Adjust</button>
                        <button onClick={() => handleTimerUpdate(order._id, { action: order.prepPausedAt ? 'resume' : 'pause' })} className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-800">{order.prepPausedAt ? 'Resume' : 'Pause'}</button>
                      </div>
                      {order.prepPausedAt && <p className="text-[10px] font-semibold text-amber-700">Timer paused</p>}
                    </div>
                  )}
                  {order.status === 'pending' && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1">
                      <p className="text-[11px] font-bold text-amber-900">Estimated prep time: {order.prepTimeMinutes || 15} min</p>
                      <p className="text-[10px] text-amber-700">Adjust before accepting; countdown starts only after acceptance.</p>
                      <input id={`accept-prep-${order._id}`} type="number" min="1" max="240" defaultValue={order.prepTimeMinutes || 15} className="w-24 rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-xs font-bold" aria-label="Initial preparation minutes" />
                    </div>
                  )}

                  {/* Special Kitchen Notes Banner */}
                  {order.specialNotes && (
                    <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Diner Special Note:</span> {order.specialNotes}
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="divide-y divide-slate-100 border-t border-b border-slate-100 py-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-start justify-between text-xs">
                        <div className="flex items-start gap-2">
                          <span className="font-extrabold text-slate-900 min-w-[20px]">
                            {item.quantity}×
                          </span>
                          <DietaryBadge isVeg={item.isVeg} className="mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">{item.name}{item.selectedSize ? ' · ' + item.selectedSize : ''}</p>
                            {item.specialInstructions && (
                              <p className="text-[11px] text-brand-600 italic mt-0.5">
                                "{item.specialInstructions}"
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-semibold text-slate-700 flex-shrink-0">
                          {formatCurrency(item.price * item.quantity, restaurant?.currency)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bill Summary */}
                  <div className="space-y-1 text-xs pt-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(order.subtotal, restaurant?.currency)}</span>
                    </div>
                    {order.tax > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Tax ({restaurant?.taxPercentage || 0}%)</span>
                        <span>{formatCurrency(order.tax, restaurant?.currency)}</span>
                      </div>
                    )}
                    {order.serviceCharge > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Service Charge</span>
                        <span>{formatCurrency(order.serviceCharge, restaurant?.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-slate-900 text-sm pt-1 border-t border-slate-100">
                      <span>Total Bill</span>
                      <span className="text-brand-600">
                        {formatCurrency(order.totalAmount, restaurant?.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Payment: Pay at Counter (Cash)</span>
                      <span className={order.paymentStatus === 'paid' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Advancement Action Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-100/60 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => { const minutes = Number(document.getElementById(`accept-prep-${order._id}`)?.value); handleUpdateStatus(order._id, 'accepted', minutes >= 1 && minutes <= 240 ? minutes : undefined); }}
                        className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
                      >
                        Accept Order
                      </button>
                    </>
                  )}

                  {order.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'preparing')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
                    >
                      <ChefHat className="w-4 h-4" />
                      Start Cooking (Preparing)
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'ready')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Mark Ready for Table
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'completed')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Mark Served
                    </button>
                  )}

                  {(order.status === 'completed' || order.status === 'cancelled') && (
                    <div className="w-full text-center py-1 text-xs text-slate-400 font-medium">
                      Order is {order.status}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
