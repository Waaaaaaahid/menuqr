const storageKey = (restaurantSlug) => `menuqr_customer_orders_${restaurantSlug}`;
const legacyStorageKey = (restaurantSlug) => `menuqr_active_order_${restaurantSlug}`;

const readStoredOrders = (restaurantSlug) => {
  if (!restaurantSlug || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(restaurantSlug));
    const legacyRaw = window.localStorage.getItem(legacyStorageKey(restaurantSlug));
    const parsed = raw ? JSON.parse(raw) : [];
    const currentOrders = Array.isArray(parsed) ? parsed : parsed?.orderId ? [parsed] : [];
    const legacyOrder = legacyRaw ? JSON.parse(legacyRaw) : null;
    const combined = [...currentOrders, ...(legacyOrder?.orderId ? [legacyOrder] : [])];
    const unique = [...new Map(combined.filter((order) => order?.orderId).map((order) => [order.orderId, order])).values()];
    const fresh = unique.filter((order) => {
      const status = String(order.status || '').toLowerCase();
      if (!['completed', 'cancelled'].includes(status)) return true;
      const savedAt = new Date(order.savedAt || order.createdAt || 0).getTime();
      return savedAt && Date.now() - savedAt <= 24 * 60 * 60 * 1000;
    });
    if (raw || legacyRaw) {
      window.localStorage.setItem(storageKey(restaurantSlug), JSON.stringify(fresh));
      window.localStorage.removeItem(legacyStorageKey(restaurantSlug));
    }
    return fresh.sort((a, b) => new Date(a.createdAt || a.savedAt || 0) - new Date(b.createdAt || b.savedAt || 0));
  } catch {
    return [];
  }
};

export const getCustomerOrders = (restaurantSlug) => readStoredOrders(restaurantSlug);

export const getCustomerActiveOrder = (restaurantSlug) => {
  const orders = readStoredOrders(restaurantSlug);
  const latest = [...orders].reverse().find((order) => String(order.status || '').toLowerCase() !== 'cancelled');
  return latest ? { ...latest, orderCount: orders.length } : null;
};

export const saveCustomerActiveOrder = (restaurantSlug, order) => {
  if (!restaurantSlug || !order?.orderId || typeof window === 'undefined') return;
  try {
    const orders = readStoredOrders(restaurantSlug);
    const existingIndex = orders.findIndex((item) => item.orderId === order.orderId);
    const nextOrder = { ...(existingIndex >= 0 ? orders[existingIndex] : {}), ...order };
    if (existingIndex >= 0) orders[existingIndex] = nextOrder;
    else orders.push(nextOrder);
    window.localStorage.setItem(storageKey(restaurantSlug), JSON.stringify(orders));
    window.localStorage.removeItem(legacyStorageKey(restaurantSlug));
  } catch (error) {
    console.warn('Could not save customer order on this device:', error);
  }
};

export const clearCustomerActiveOrder = (restaurantSlug, orderId) => {
  if (!restaurantSlug || typeof window === 'undefined') return;
  try {
    if (!orderId) {
      window.localStorage.removeItem(storageKey(restaurantSlug));
      window.localStorage.removeItem(legacyStorageKey(restaurantSlug));
      return;
    }
    const remaining = readStoredOrders(restaurantSlug).filter((order) => order.orderId !== orderId);
    window.localStorage.setItem(storageKey(restaurantSlug), JSON.stringify(remaining));
  } catch {
    // Ignore unavailable browser storage.
  }
};

export const isCustomerOrderActive = (status) =>
  String(status || '').toLowerCase() !== 'cancelled';
