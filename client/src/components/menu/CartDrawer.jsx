import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  QrCode,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CreditCard,
  Banknote,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import { DietaryBadge } from '../common/Badge';
import api from '../../api/axios';
import { useToast } from '../common/Toast';

export default function CartDrawer({ restaurant, isOpen, onClose, onOpen }) {
  const {
    items,
    subtotal,
    itemCount,
    updateQuantity,
    removeFromCart,
    clearCart,
    tableNumber,
    tableToken,
    customerInfo,
    setCustomerInfo,
    specialNotes,
    setSpecialNotes,
  } = useCart();

  const { addToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [tableInput, setTableInput] = useState(tableNumber || '');

  if (itemCount === 0 && !isOpen) return null;

  // Calculate bill amounts
  const tax = Number(((subtotal * (restaurant?.taxPercentage || 0)) / 100).toFixed(2));
  const serviceCharge = Number(
    ((subtotal * (restaurant?.serviceChargePercentage || 0)) / 100).toFixed(2)
  );
  const grandTotal = Number((subtotal + tax + serviceCharge).toFixed(2));

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    const activeTable = tableNumber;
    if (!activeTable || !tableToken) {
      addToast('Please enter your Table Number so the kitchen knows where to serve!', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        restaurantSlug: restaurant.slug,
        tableNumber: activeTable,
        tableKey: tableToken,
        customerName: customerInfo.name || 'Guest',
        customerPhone: customerInfo.phone || '',
        specialNotes: specialNotes || '',
        paymentMethod: 'cash',
        items: items.map((i) => ({
          menuItemId: i._id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          specialInstructions: i.specialInstructions || '',
          isVeg: i.isVeg,
        })),
      };

      const res = await api.post('/public/orders', payload);
      if (res.data.success) {
        // Trigger celebratory confetti effect
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}

        addToast('Order placed successfully! The kitchen is preparing your meal.', 'success', 5000);
        clearCart();
        onClose();
        navigate(`/order/${res.data.order._id}`);
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Bottom Bar (visible when cart has items and drawer is closed) */}
      {!isOpen && itemCount > 0 && (
        <div className="fixed bottom-5 left-0 right-0 z-40 px-4 max-w-lg mx-auto animate-in slide-in-from-bottom-4 duration-200">
          <button
            onClick={onOpen}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-brand-600 to-amber-500 text-white font-black text-sm shadow-xl shadow-brand-500/30 flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                {itemCount}
              </div>
              <span className="tracking-tight">View Your Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold">
                {formatCurrency(grandTotal, restaurant?.currency)}
              </span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer Sliding Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-xs">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Your Dining Cart</h2>
                    <p className="text-[11px] text-slate-500">
                      {itemCount} {itemCount === 1 ? 'dish' : 'dishes'} selected
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Table Number Identifier */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-brand-600" />
                      <span>Table Number *</span>
                    </div>
                    {tableNumber && (
                      <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-md font-extrabold">
                        Scanned from QR
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Scan the QR code on your table"
                    value={tableNumber || tableInput}
                    readOnly
                    
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-amber-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold text-slate-900"
                  />
                </div>

                {/* Items List */}
                {items.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Your cart is empty. Tap any dish on the menu to add!
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Selected Dishes
                    </h3>
                    <div className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <div key={item._id} className="py-3 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <DietaryBadge isVeg={item.isVeg} className="mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">
                                {item.name}
                              </h4>
                              <p className="text-[11px] font-semibold text-slate-500">
                                {formatCurrency(item.price, restaurant?.currency)} each
                              </p>
                              {item.specialInstructions && (
                                <p className="text-[10px] text-brand-600 italic mt-0.5">
                                  "{item.specialInstructions}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Counter */}
                            <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                              <button
                                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                className="p-0.5 hover:text-rose-600"
                              >
                                {item.quantity === 1 ? (
                                  <Trash2 className="w-3 h-3 text-rose-500" />
                                ) : (
                                  <Minus className="w-3 h-3" />
                                )}
                              </button>
                              <span className="w-4 text-center text-slate-900">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                className="p-0.5 hover:text-brand-600"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="text-xs font-extrabold text-slate-900 min-w-[50px] text-right">
                              {formatCurrency(item.price * item.quantity, restaurant?.currency)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diner Details & Special Instructions */}
                {items.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Diner Notes & Preferences
                    </h3>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Your Name (Optional)"
                        value={customerInfo.name}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, name: e.target.value })
                        }
                        className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                      <input
                        type="tel"
                        placeholder="Phone (Optional)"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, phone: e.target.value })
                        }
                        className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Special kitchen notes or allergies (e.g. no peanuts, extra raita)..."
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />

                    {/* Payment Notice */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="font-bold text-slate-800">Pay at Counter / Cash</p>
                          <p className="text-[10px] text-slate-400">Pay after dining or at counter</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer: Bill Breakdown & Submit */}
              {items.length > 0 && (
                <div className="p-5 bg-slate-50 border-t border-slate-200/80 space-y-3">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold">{formatCurrency(subtotal, restaurant?.currency)}</span>
                    </div>
                    {tax > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Tax ({restaurant?.taxPercentage || 0}%)</span>
                        <span>{formatCurrency(tax, restaurant?.currency)}</span>
                      </div>
                    )}
                    {serviceCharge > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Service Charge</span>
                        <span>{formatCurrency(serviceCharge, restaurant?.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                      <span>Total to Pay</span>
                      <span className="text-brand-600">
                        {formatCurrency(grandTotal, restaurant?.currency)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    className="w-full py-3.5 px-5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm shadow-md shadow-brand-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Place Table Order</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
