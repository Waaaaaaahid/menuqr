import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock3, PackageCheck, RefreshCw, ShoppingBag } from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { getCustomerOrders, saveCustomerActiveOrder } from '../../utils/customerOrders';
import { formatCurrency } from '../../utils/formatters';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-sky-50 text-sky-700 border-sky-200',
  preparing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

const statusLabels = {
  pending: 'Order Placed',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Served',
  cancelled: 'Cancelled',
};

const getTimer = (order, now) => {
  if (order.status === 'completed') return 'Served';
  if (order.status === 'cancelled') return 'Cancelled';
  if (order.status === 'ready') return 'Ready';
  if (!order.prepStartedAt) return 'Awaiting kitchen';
  if (order.prepPausedAt) {
    const seconds = Math.max(0, Number(order.prepRemainingSeconds) || 0);
    return `Paused · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
  const seconds = order.prepEndsAt
    ? Math.max(0, Math.ceil((new Date(order.prepEndsAt).getTime() - now) / 1000))
    : Math.max(0, Number(order.prepRemainingSeconds) || 0);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} left`;
};

export default function MyOrdersPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get('table') || '';
  const { socket, joinOrderRoom } = useSocket();
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockNow, setClockNow] = useState(Date.now());

  const savedOrders = useMemo(() => getCustomerOrders(slug, tableParam), [slug, tableParam]);

  useEffect(() => {
    const interval = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadOrders = async () => {
      setLoading(true);
      const results = await Promise.all(savedOrders.map(async (saved) => {
        try {
          const response = await api.get(`/public/orders/${saved.orderId}`);
          if (!response.data?.success) throw new Error('Order unavailable');
          const fresh = response.data.order;
          const restaurantData = response.data.restaurant;
          if (mounted && restaurantData) setRestaurant(restaurantData);
          const record = {
            ...saved,
            orderId: fresh._id,
            orderNumber: fresh.orderNumber || saved.orderNumber,
            restaurantSlug: restaurantData?.slug || slug,
            restaurantName: restaurantData?.name || saved.restaurantName,
            tableNumber: fresh.table?.tableNumber || saved.tableNumber,
            tableToken: fresh.table?.qrToken || saved.tableToken,
            status: fresh.status,
            createdAt: fresh.createdAt || saved.createdAt,
            items: fresh.items || saved.items || [],
            subtotal: fresh.subtotal,
            totalAmount: fresh.totalAmount,
            prepStartedAt: fresh.prepStartedAt,
            prepEndsAt: fresh.prepEndsAt,
            prepPausedAt: fresh.prepPausedAt,
            prepRemainingSeconds: fresh.prepRemainingSeconds,
          };
          saveCustomerActiveOrder(slug, record);
          return record;
        } catch {
          return saved;
        }
      }));
      if (mounted) {
        setOrders(results.sort((a, b) => new Date(a.createdAt || a.savedAt || 0) - new Date(b.createdAt || b.savedAt || 0)));
        setLoading(false);
      }
    };
    loadOrders();
    return () => { mounted = false; };
  }, [slug, tableParam]);

  useEffect(() => {
    if (!socket || !orders.length) return;
    orders.forEach((order) => joinOrderRoom(order.orderId));
    const handleStatusUpdate = (updatedOrder) => {
      setOrders((current) => current.map((order) => {
        if (order.orderId !== updatedOrder._id) return order;
        const next = {
          ...order,
          status: updatedOrder.status,
          orderNumber: updatedOrder.orderNumber || order.orderNumber,
          items: updatedOrder.items || order.items,
          tableNumber: updatedOrder.table?.tableNumber || order.tableNumber,
          prepStartedAt: updatedOrder.prepStartedAt,
          prepEndsAt: updatedOrder.prepEndsAt,
          prepPausedAt: updatedOrder.prepPausedAt,
          prepRemainingSeconds: updatedOrder.prepRemainingSeconds,
        };
        saveCustomerActiveOrder(slug, next);
        return next;
      }));
    };
    socket.on('customer_order_status', handleStatusUpdate);
    return () => socket.off('customer_order_status', handleStatusUpdate);
  }, [socket, orders.map((order) => order.orderId).join('|'), slug]);

  const firstOrder = orders[0];
  const menuTable = firstOrder?.tableNumber || tableParam;
  const menuToken = firstOrder?.tableToken || '';
  const menuUrl = menuTable
    ? `/menu/${slug}?table=${encodeURIComponent(menuTable)}&key=${encodeURIComponent(menuToken)}&browse=1`
    : `/menu/${slug}`;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <Link to={menuUrl} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Menu
          </Link>
          <span className="text-xs font-bold text-slate-400">TABLE ORDERS</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-600">{restaurant?.name || firstOrder?.restaurantName || 'Restaurant'}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">My Orders</h1>
              <p className="mt-1 text-xs text-slate-500">{orders.length} {orders.length === 1 ? 'order' : 'orders'} on this device{firstOrder?.tableNumber ? ` · Table ${firstOrder.tableNumber}` : ''}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs font-semibold text-slate-500">
            <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <PackageCheck className="mx-auto h-9 w-9 text-slate-300" />
            <h2 className="mt-3 text-base font-black text-slate-900">No saved orders yet</h2>
            <p className="mt-1 text-xs text-slate-500">Orders placed on this device will appear here.</p>
            <Link to={menuUrl} className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">Browse Menu</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, index) => {
              const status = String(order.status || 'pending').toLowerCase();
              const items = Array.isArray(order.items) ? order.items : [];
              const itemSummary = items.slice(0, 3).map((item) => `${item.quantity || 1}× ${item.name}`).join(' · ');
              const remaining = items.length > 3 ? ` +${items.length - 3} more` : '';
              return (
                <Link
                  key={order.orderId}
                  to={`/order/${order.orderId}?fromOrders=${encodeURIComponent(slug)}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order {index + 1}</p>
                      <h2 className="mt-0.5 text-lg font-black text-slate-900">{order.orderNumber || `#${String(order.orderId).slice(-6)}`}</h2>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusStyles[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {statusLabels[status] || status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-700">{itemSummary || 'Order details' }{remaining}</p>
                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400">PREPARATION TIMER</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-black tabular-nums text-slate-900">
                        <Clock3 className="h-4 w-4 text-brand-600" /> {getTimer(order, clockNow)}
                      </p>
                    </div>
                    <div className="text-right">
                      {Number.isFinite(Number(order.totalAmount)) && (
                        <p className="text-sm font-black text-slate-900">{formatCurrency(order.totalAmount, restaurant?.currency)}</p>
                      )}
                      <p className="mt-1 text-[10px] font-bold text-brand-600">View live tracking →</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
