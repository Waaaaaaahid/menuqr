import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Clock, Flame, Star, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { DietaryBadge, TagBadge } from '../common/Badge';

export default function FoodDetailModal({ dish, currency, cartItem, isOpen, onClose, onAddToCart }) {
  const [qty, setQty] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    if (cartItem) {
      setQty(cartItem.quantity || 1);
      setInstructions(cartItem.specialInstructions || '');
      setSelectedSize(cartItem.selectedSize || dish?.sizeOptions?.[0]?.name || '');
    } else {
      setQty(1);
      setInstructions('');
      setSelectedSize(dish?.sizeOptions?.[0]?.name || '');
    }
  }, [dish, cartItem, isOpen]);

  if (!isOpen || !dish) return null;

  const selectedOption = (dish.sizeOptions || []).find((option) => option.name === selectedSize);
  const unitPrice = selectedOption ? selectedOption.price : dish.price;
  const totalPrice = unitPrice * qty;

  const handleAdd = () => {
    onAddToCart(dish, qty, instructions, selectedSize);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative h-56 sm:h-64 w-full bg-slate-100">
          {dish.image ? (
            <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">
              MenuQR
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <DietaryBadge isVeg={dish.isVeg} />
              {dish.isBestseller && <TagBadge type="bestseller" />}
              {dish.isSpicy && <TagBadge type="spicy" spiceLevel={dish.spiceLevel} />}
              {dish.isNewItem && <TagBadge type="new" />}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
              {dish.name}
            </h2>
            <p className="text-base font-extrabold text-brand-600 mt-1">
              {formatCurrency(unitPrice, currency)}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {dish.description || 'Prepared fresh upon order with our finest restaurant ingredients.'}
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-4 h-4" />
            <span>Preparation time: {dish.preparationTime || '15-20 min'}</span>
          </div>

          {dish.sizeOptions?.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Choose Size *</label>
              <div className="grid grid-cols-3 gap-2">
                {dish.sizeOptions.map((option) => (
                  <button key={option.name} type="button" onClick={() => setSelectedSize(option.name)}
                    className={"rounded-xl border p-3 text-left transition-all " + (selectedSize === option.name ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 bg-white')}>
                    <span className="block text-xs font-bold text-slate-900">{option.name}</span>
                    <span className="block text-xs font-semibold text-brand-600 mt-1">{formatCurrency(option.price, currency)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions Input */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Special Kitchen Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Mild spice, no onions, dressing on the side..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Bottom Bar: Quantity & Add Button */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="font-extrabold text-sm min-w-[20px] text-center text-slate-900">
              {qty}
            </span>
            <button
              onClick={() => setQty(qty + 1)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="flex-1 py-3 px-5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm shadow-md shadow-brand-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between"
          >
            <span>{cartItem ? 'Update Order' : 'Add to Order'}</span>
            <span>{formatCurrency(totalPrice, currency)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
