import React from 'react';
import { Plus, Minus, Star, Flame, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { DietaryBadge, TagBadge } from '../common/Badge';

export default function FoodCard({ dish, currency, cartItem, onAddToCart, onUpdateQuantity, onOpenDetail }) {
  const quantity = cartItem?.quantity || 0;

  return (
    <div
      onClick={() => onOpenDetail(dish)}
      className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-subtle hover:shadow-dropdown transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
    >
      <div className="flex gap-4">
        {/* Left: Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <DietaryBadge isVeg={dish.isVeg} />
            {dish.isBestseller && <TagBadge type="bestseller" />}
            {dish.isSpicy && <TagBadge type="spicy" spiceLevel={dish.spiceLevel} />}
            {dish.isNewItem && <TagBadge type="new" />}
          </div>

          <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
            {dish.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {dish.description}
          </p>

          <div className="pt-1">
            <span className="text-sm font-extrabold text-slate-900">
              {dish.sizeOptions?.length ? 'From ' + formatCurrency(Math.min(...dish.sizeOptions.map((s) => s.price)), currency) : formatCurrency(dish.price, currency)}
            </span>
          </div>
        </div>

        {/* Right: Dish Image & Add/Quantity Button */}
        <div className="relative flex-shrink-0 flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/80 shadow-xs">
            {dish.image ? (
              <img
                src={dish.image}
                alt={dish.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold">
                MenuQR
              </div>
            )}
          </div>

          {/* Floating Cart Button at bottom of image */}
          <div
            className="absolute -bottom-2.5 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {dish.sizeOptions?.length ? (
              <button onClick={() => onOpenDetail(dish)} className="px-3.5 py-1.5 rounded-xl bg-white text-brand-600 font-bold text-xs border border-brand-200 shadow-md">CHOOSE SIZE</button>
            ) : quantity > 0 ? (
              <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/30 text-xs font-bold">
                <button
                  onClick={() => onUpdateQuantity(dish._id, quantity - 1)}
                  className="p-1 hover:bg-brand-600 rounded-md transition-colors"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <span className="px-1 text-xs">{quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(dish._id, quantity + 1)}
                  className="p-1 hover:bg-brand-600 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(dish, 1)}
                className="px-3.5 py-1.5 rounded-xl bg-white text-brand-600 hover:bg-brand-500 hover:text-white font-bold text-xs border border-brand-200 shadow-md transition-all hover:scale-105 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                ADD
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
