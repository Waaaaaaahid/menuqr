const storageKey = (restaurantSlug) => `menuqr_active_order_${restaurantSlug}`;

export const getCustomerActiveOrder = (restaurantSlug) => {
  if (!restaurantSlug || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(restaurantSlug));
    if (!raw) return null;
    const order = JSON.parse(raw);
    // Keep served orders available for review for 24 hours, then let a fresh visit start at the menu.
    if (String(order?.status || '').toLowerCase() === 'completed') {
      const savedAt = new Date(order.savedAt || 0).getTime();
      if (!savedAt || Date.now() - savedAt > 24 * 60 * 60 * 1000) {
        window.localStorage.removeItem(storageKey(restaurantSlug));
        return null;
      }
    }
    return order;
  } catch {
    return null;
  }
};

export const saveCustomerActiveOrder = (restaurantSlug, order) => {
  if (!restaurantSlug || !order?.orderId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(restaurantSlug), JSON.stringify(order));
  } catch (error) {
    console.warn('Could not save customer order on this device:', error);
  }
};

export const clearCustomerActiveOrder = (restaurantSlug, orderId) => {
  if (!restaurantSlug || typeof window === 'undefined') return;
  try {
    const current = getCustomerActiveOrder(restaurantSlug);
    if (!orderId || current?.orderId === orderId) {
      window.localStorage.removeItem(storageKey(restaurantSlug));
    }
  } catch {
    // Ignore unavailable browser storage.
  }
};

// Keep the latest served order on this device so a fresh QR scan can reopen
// its receipt/review screen. Only cancelled orders are discarded.
export const isCustomerOrderActive = (status) =>
  String(status || '').toLowerCase() !== 'cancelled';
