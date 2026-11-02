import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  FolderTree,
  BellRing,
  QrCode,
  BarChart3,
  Store,
  UserCheck,
  CreditCard,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, setIsOpen, pendingOrdersCount = 0 }) {
  const { restaurant } = useAuth();

  const navItems = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Menu Items', to: '/dashboard/menu', icon: UtensilsCrossed },
    { name: 'Categories', to: '/dashboard/categories', icon: FolderTree },
    {
      name: 'Live Orders',
      to: '/dashboard/orders',
      icon: BellRing,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeColor: 'bg-brand-500 text-white animate-pulse',
    },
    { name: 'Tables & QRs', to: '/dashboard/tables', icon: QrCode },
    { name: 'Analytics', to: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Restaurant Settings', to: '/dashboard/settings', icon: Store },
    { name: 'Account Profile', to: '/dashboard/profile', icon: UserCheck },
    { name: 'Billing & Plans', to: '/dashboard/billing', icon: CreditCard },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-950 text-slate-300 w-64 flex flex-col border-r border-slate-800/80 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/30">
              <QrCode className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white">
                Menu<span className="text-brand-500">QR</span>
              </span>
              <span className="text-[9px] font-semibold tracking-wider uppercase text-slate-400 -mt-1">
                Owner Dashboard
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Restaurant identity pill */}
        <div className="p-4">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center gap-3">
            {restaurant?.logo ? (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-10 h-10 rounded-lg object-cover border border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold flex items-center justify-center text-sm">
                {restaurant?.name ? restaurant.name.substring(0, 2).toUpperCase() : 'QR'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">
                {restaurant?.name || 'My Restaurant'}
              </h4>
              <p className="text-[11px] text-slate-400 truncate">
                {restaurant?.cuisine?.[0] || 'Multi-Cuisine'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                end={item.to === '/dashboard'}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Public Menu Quick Link */}
        <div className="p-4 border-t border-slate-800/80">
          {restaurant?.slug ? (
            <Link
              to={`/menu/${restaurant.slug}?table=T-01`}
              target="_blank"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-brand-400" />
                <span>View Public Menu</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </Link>
          ) : (
            <div className="text-[11px] text-slate-500 text-center">
              Create profile to activate menu
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
