const storageKey = (restaurantSlug, tableNumber) =>
  `menuqr_customer_orders_${restaurantSlug}_${encodeURIComponent(String(tableNumber || '__all__').trim().toLowerCase())}`;
const legacyStorageKey = (restaurantSlug) => `menuqr_active_order_${restaurantSlug}`;
const oldMultiOrderKey = (restaurantSlug) => `menuqr_customer_orders_${restaurantSlug}`;

const normalizeTable = (value) => String(value || '').trim().toLowerCase();

const readAllStoredOrders = (restaurantSlug) => {
  if (!restaurantSlug || typeof window === 'undefined') return [];
  try {
    const keys = [oldMultiOrderKey(restaurantSlug), legacyStorageKey(restaurantSlug)];
    const combined = [];
    keys.forEach((key) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) combined.push(...parsed);
      else if (parsed?.orderId) combined.push(parsed);
    });
    const unique = [...new Map(combined.filter((order) => order?.orderId).map((order) => [order.orderId, order])).values()];
    return unique.filter((order) => {
      const status = String(order.status || '').toLowerCase();
      if (!['completed', 'cancelled'].includes(status)) return true;
      const savedAt = new Date(order.savedAt || order.createdAt || 0).getTime();
      return savedAt && Date.now() - savedAt <= 24 * 60 * 60 * 1000;
    });
  } catch {
    return [];
  }
};

const readStoredOrders = (restaurantSlug, tableNumber) => {
  if (!restaurantSlug || typeof window === 'undefined') return [];
  try {
    const tableScopedRaw = window.localStorage.getItem(storageKey(restaurantSlug, tableNumber));
    const scopedOrders = tableScopedRaw ? JSON.parse(tableScopedRaw) : [];
    const oldOrders = readAllStoredOrders(restaurantSlug).filter(
      (order) => normalizeTable(order.tableNumber) === normalizeTable(tableNumber)
    );
    const combined = [...(Array.isArray(scopedOrders) ? scopedOrders : []), ...oldOrders];
    const unique = [...new Map(combined.filter((order) => order?.orderId).map((order) => [order.orderId, order])).values()];
    return unique.sort((a, b) => new Date(a.createdAt || a.savedAt || 0) - new Date(b.createdAt || b.savedAt || 0));
  } catch {
    return [];
  }
};

export const getCustomerOrders = (restaurantSlug, tableNumber) =>
  readStoredOrders(restaurantSlug, tableNumber);

export const getCustomerActiveOrder = (restaurantSlug, tableNumber) => {
  const orders = readStoredOrders(restaurantSlug, tableNumber);
  const latest = [...orders].reverse().find((order) => String(order.status || '').toLowerCase() !== 'cancelled');
  return latest ? { ...latest, orderCount: orders.length } : null;
};

export const saveCustomerActiveOrder = (restaurantSlug, order) => {
  if (!restaurantSlug || !order?.orderId || typeof window === 'undefined') return;
  try {
    const tableNumber = order.tableNumber || '';
    const orders = readStoredOrders(restaurantSlug, tableNumber);
    const existingIndex = orders.findIndex((item) => item.orderId === order.orderId);
    const nextOrder = { ...(existingIndex >= 0 ? orders[existingIndex] : {}), ...order };
    if (existingIndex >= 0) orders[existingIndex] = nextOrder;
    else orders.push(nextOrder);
    window.localStorage.setItem(storageKey(restaurantSlug, tableNumber), JSON.stringify(orders));
  } catch (error) {
    console.warn('Could not save customer order on this device:', error);
  }
};

export const clearCustomerActiveOrder = (restaurantSlug, orderId, tableNumber) => {
  if (!restaurantSlug || typeof window === 'undefined') return;
  try {
    if (!orderId) {
      window.localStorage.removeItem(storageKey(restaurantSlug, tableNumber));
      return;
    }
    const remaining = readStoredOrders(restaurantSlug, tableNumber).filter((order) => order.orderId !== orderId);
    window.localStorage.setItem(storageKey(restaurantSlug, tableNumber), JSON.stringify(remaining));
  } catch {
    // Ignore unavailable browser storage.
  }
};

export const isCustomerOrderActive = (status) =>
  String(status || '').toLowerCase() !== 'cancelled';
