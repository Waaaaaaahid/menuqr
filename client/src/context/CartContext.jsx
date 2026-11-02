import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [items, setItems] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [tableToken, setTableToken] = useState('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [specialNotes, setSpecialNotes] = useState('');

  // Restore cart when restaurantSlug changes
  useEffect(() => {
    if (!restaurantSlug) return;
    try {
      const savedCart = localStorage.getItem(`menuqr_cart_${restaurantSlug}`);
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      } else {
        setItems([]);
      }
    } catch (e) {
      console.warn('Error restoring cart:', e);
    }
  }, [restaurantSlug]);

  // Save cart on changes
  useEffect(() => {
    if (!restaurantSlug) return;
    try {
      localStorage.setItem(`menuqr_cart_${restaurantSlug}`, JSON.stringify(items));
    } catch (e) {
      console.warn('Error saving cart:', e);
    }
  }, [items, restaurantSlug]);

  const addToCart = (dish, qty = 1, instructions = '', selectedSize = '') => {
    setItems((prev) => {
      const lineId = selectedSize ? dish._id + '__' + selectedSize : dish._id;
      const existingIndex = prev.findIndex((i) => i._id === lineId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty,
          specialInstructions: instructions || updated[existingIndex].specialInstructions,
        };
        return updated;
      }
      return [
        ...prev,
        {
          _id: lineId,
          menuItemId: dish._id,
          name: dish.name,
          price: selectedSize ? ((dish.sizeOptions || []).find((s) => s.name === selectedSize)?.price ?? dish.price) : dish.price,
          selectedSize,
          quantity: qty,
          isVeg: dish.isVeg,
          image: dish.image,
          specialInstructions: instructions,
        },
      ];
    });
  };

  const updateQuantity = (dishId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(dishId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i._id === dishId ? { ...i, quantity: newQty } : i))
    );
  };

  const removeFromCart = (dishId) => {
    setItems((prev) => prev.filter((i) => i._id !== dishId));
  };

  const clearCart = () => {
    setItems([]);
    if (restaurantSlug) {
      localStorage.removeItem(`menuqr_cart_${restaurantSlug}`);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        restaurantSlug,
        setRestaurantSlug,
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal: Number(subtotal.toFixed(2)),
        itemCount,
        tableNumber,
        setTableNumber,
        tableToken,
        setTableToken,
        customerInfo,
        setCustomerInfo,
        specialNotes,
        setSpecialNotes,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
