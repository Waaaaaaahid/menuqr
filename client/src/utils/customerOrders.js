const storageKey = (restaurantSlug) => `menuqr_active_order_${restaurantSlug}`;

export const getCustomerActiveOrder = (restaurantSlug) => {
  if (!restaurantSlug || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(restaurantSlug));
    return raw ? JSON.parse(raw) : null;
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

export const isCustomerOrderActive = (status) =>
  !['completed', 'cancelled'].includes(String(status || '').toLowerCase());
