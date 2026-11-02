import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  X,
  QrCode,
  PackageCheck,
} from 'lucide-react';

export default function RestaurantHeader({ restaurant, tableNumber, onSelectTable, activeOrder }) {
  const [infoOpen, setInfoOpen] = useState(false);

  if (!restaurant) return null;

  return (
    <>
      <header className="relative bg-white border-b border-slate-200/80 shadow-xs">
        {/* Cover Photo */}
        <div className="relative h-44 sm:h-56 w-full bg-slate-900 overflow-hidden">
          {restaurant.coverImage ? (
            <img
              src={restaurant.coverImage}
              alt={restaurant.name}
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
              <span className="text-white/20 font-black text-4xl uppercase tracking-widest">
                {restaurant.name}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

          {/* Table Badge on top right */}
          <div className="absolute top-4 right-4 z-10">
            {tableNumber ? (
              <button
                onClick={onSelectTable}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white border border-white/20 backdrop-blur-md shadow-md text-xs font-bold transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                <span>Table: {tableNumber}</span>
                <span className="text-[10px] text-slate-300 ml-1 font-normal underline">
                  Change
                </span>
              </button>
            ) : (
              <button
                onClick={onSelectTable}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-md text-xs font-bold transition-all"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Select Table</span>
              </button>
            )}
          </div>
        </div>

        {/* Restaurant Identity Row */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-12 sm:-mt-14 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-end gap-3.5 sm:gap-4">
              {/* Logo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-lg border-2 border-white flex-shrink-0 overflow-hidden">
                {restaurant.logo ? (
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white font-black text-xl flex items-center justify-center">
                    {restaurant.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Title & tags */}
              <div className="pt-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {restaurant.name}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                  {restaurant.cuisine?.map((c, i) => (
                    <span key={i} className="inline-flex items-center">
                      {c}
                      {i < restaurant.cuisine.length - 1 && <span className="mx-1">•</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Status, saved order shortcut & restaurant info */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start pt-1">
              {activeOrder?.orderId && (
                <a
                  href={`/order/${activeOrder.orderId}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-colors whitespace-nowrap"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Track My Order</span>
                </a>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Open Now</span>
              </span>

              <button
                onClick={() => setInfoOpen(true)}
                className="p-1.5 sm:px-3 sm:py-1 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
              >
                <Info className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Restaurant Info</span>
              </button>
            </div>
          </div>

          {/* Announcement Banner */}
          {restaurant.announcement && (
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-amber-500/10 border border-amber-200/80 text-amber-900 text-xs font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <span>{restaurant.announcement}</span>
            </div>
          )}
        </div>
      </header>

      {/* Restaurant Info Dialog / Bottom Sheet */}
      {infoOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">About {restaurant.name}</h3>
              <button
                onClick={() => setInfoOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              {restaurant.description && (
                <p className="leading-relaxed text-slate-700">{restaurant.description}</p>
              )}

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Opening Hours</span>
                    <span>{restaurant.openingHours || '11:00 AM - 11:00 PM'}</span>
                  </div>
                </div>

                {restaurant.address?.street && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Address</span>
                      <span>
                        {restaurant.address.street}, {restaurant.address.city},{' '}
                        {restaurant.address.state} {restaurant.address.zip}
                      </span>
                    </div>
                  </div>
                )}

                {restaurant.phone && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Phone</span>
                      <a href={`tel:${restaurant.phone}`} className="text-brand-600 hover:underline">
                        {restaurant.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
