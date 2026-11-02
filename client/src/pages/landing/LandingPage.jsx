import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  ChevronDown,
  LayoutDashboard,
  Utensils,
  Smartphone,
  Eye,
  DollarSign,
  Star,
  Users,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: 'Do customers need to download an app to view the menu or order?',
      a: 'No app download is ever required! Diners simply point their smartphone camera at the QR code on the table, and your high-speed digital menu opens immediately in their browser.',
    },
    {
      q: 'Can I change prices and dishes without re-printing QR codes?',
      a: 'Yes, 100%! That is the superpower of MenuQR. You can update prices, mark 86’d dishes as sold out, or add new specials at any time from your owner dashboard. The QR codes on your tables always point to your current live menu.',
    },
    {
      q: 'How do kitchen staff receive table orders?',
      a: 'Orders arrive in real-time on your dashboard using WebSockets. When a diner places an order from Table 4, your screen chimes and flashes instantly with the table number, ordered dishes, customer notes, and order total.',
    },
    {
      q: 'Can I generate unique QR codes for each dining table?',
      a: 'Yes! MenuQR lets you create unlimited tables with one click or in bulk. You can download crisp vector SVGs, high-res PNGs, or print custom tabletop tent cards directly.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'Currently, MenuQR supports cash and pay-at-counter, which fits standard restaurant workflows. Online credit card payments and gateway integrations are rolling out in the next phase.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      {/* Sticky Marketing Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-amber-50/50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Next-Gen Restaurant Hospitality SaaS</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 max-w-4xl mx-auto leading-[1.1]">
            Your Restaurant.{' '}
            <span className="bg-gradient-to-r from-brand-600 to-amber-500 bg-clip-text text-transparent">
              Your Digital Menu.
            </span>{' '}
            One QR Code.
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Replace costly paper menus with an elegant, responsive mobile digital menu. Allow diners to order directly from their table and receive tickets in your kitchen in real time.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm shadow-xl shadow-brand-500/30 hover:shadow-brand-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Start Free for Your Restaurant</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/menu/royal-biryani?table=T-01"
              target="_blank"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm transition-all"
            >
              <Smartphone className="w-4 h-4 text-brand-500" />
              <span>Try Live Customer Menu</span>
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-400 font-medium">
            No credit card required • Instant setup in under 2 minutes
          </p>

          {/* Dual Mockup Showcase */}
          <div className="mt-14 relative max-w-5xl mx-auto">
            {/* Glow backdrop */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/20 to-amber-500/20 rounded-3xl blur-2xl -z-10"></div>

            <div className="bg-slate-900 rounded-3xl p-3 sm:p-5 shadow-2xl border border-slate-800 text-left">
              {/* Window chrome */}
              <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                  <span className="ml-2 font-mono text-[11px] text-slate-400">menuqr.com/dashboard</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Orders Connected
                </div>
              </div>

              {/* Mockup Inside Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {/* Dashboard Stats snippet */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Scans</span>
                      <p className="text-xl font-black text-white mt-0.5">2,840</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Today Orders</span>
                      <p className="text-xl font-black text-brand-400 mt-0.5">48</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Today Revenue</span>
                      <p className="text-xl font-black text-emerald-400 mt-0.5">$2,190.50</p>
                    </div>
                  </div>

                  {/* Sample Live Order Ticket in Mockup */}
                  <div className="p-4 rounded-xl bg-slate-800/90 border border-brand-500/40 shadow-glow space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">#ORD-9102</span>
                        <span className="px-2 py-0.5 rounded bg-brand-500 text-white font-extrabold text-[10px]">
                          Table T-01
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                        Pending (Just Now)
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span>2× Royal Nizami Dum Biryani</span>
                        <span className="font-bold text-white">$49.90</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2× Saffron Rose Lassi</span>
                        <span className="font-bold text-white">$13.00</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Total Bill: <strong className="text-white">$68.24</strong></span>
                      <span className="text-emerald-400 font-bold text-[11px]">Accept Order →</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Menu Preview Snippet */}
                <div className="p-4 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-brand-500 text-white font-black text-xs flex items-center justify-center">
                          RB
                        </div>
                        <span className="font-extrabold text-xs">The Royal Biryani</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                        T-01
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex gap-2.5 items-center">
                      <img
                        src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100&auto=format&fit=crop&q=80"
                        alt="Biryani"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-extrabold text-xs truncate">Nizami Goat Biryani</p>
                        <p className="text-[10px] text-brand-600 font-bold">$24.95</p>
                      </div>
                      <button className="px-2 py-1 rounded-lg bg-brand-500 text-white text-[10px] font-extrabold">
                        + ADD
                      </button>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 text-white text-center text-[11px] font-extrabold mt-3 shadow-md">
                    🛒 View Cart (2 items • $37.95)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Three Simple Steps
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How MenuQR Powers Your Dining Room
            </h2>
            <p className="text-sm text-slate-500">
              Go from signup to serving contactless table orders in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-card hover:border-slate-300 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-brand-500/20">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">1. Setup Dishes & Categories</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add your food items, upload high-res appetizing photos, set prices, and mark dietary badges like Veg, Spicy, or Bestseller.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-card hover:border-slate-300 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center shadow-md shadow-slate-900/20">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">2. Download & Print Table QRs</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Generate unique QR codes for every dining table. Download vector SVGs or print stylish tabletop tent cards ready for acrylic stands.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-card hover:border-slate-300 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">3. Receive Live Kitchen Orders</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Diners scan to browse and submit orders. Your kitchen receives orders instantly via WebSockets with table numbers and special notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Engineered For Modern Hospitality
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything Your Restaurant Needs
            </h2>
            <p className="text-sm text-slate-500">
              Built with modern full-stack performance, multi-tenant security, and real-time order synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Real-Time Kitchen Orders</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Powered by Socket.IO. Receive new table orders in real time with audio chimes and interactive status pipelines.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Zero App Download for Diners</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Diners don't need to register or install an app. Pointing their camera immediately loads your mobile-first menu.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Table Stand & QR Generator</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Create table-specific QR codes with table number encoding. Download crisp PNGs, SVGs, or 1-click printable tent cards.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Sales & Scan Analytics</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Analyze daily visits, most popular dishes, order velocity, and sales revenue with clean interactive Recharts charts.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Live Dish Availability Toggle</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sold out of a signature fish or dessert? 86 it with a single tap in your dashboard and it instantly hides from diner carts.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Multi-Tenant Isolation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complete data separation per restaurant. Secure JWT authentication and verified ownership middleware on every endpoint.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Owner Benefits Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold border border-brand-500/30">
                <TrendingUp className="w-4 h-4" />
                <span>Measurable Restaurant ROI</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Why Restaurant Owners Love MenuQR
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Traditional paper menus are expensive to print, dirty to touch, and impossible to update on the fly. MenuQR gives you complete agility.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Save $1,200+ in Annual Print Costs</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Never pay a print shop again when changing a price, wine vintage, or seasonal dish.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">35% Faster Table Turnover</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Diners don't have to wave down busy waiters just to see the menu or place extra drinks.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">18% Higher Average Check Sizes</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Vivid food photos, bestseller recommendations, and effortless re-ordering boost dessert and drink sales.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700/60 text-center space-y-1">
                <p className="text-3xl sm:text-4xl font-black text-brand-400">100%</p>
                <p className="text-xs font-semibold text-slate-300">Contactless & Hygienic</p>
              </div>
              <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700/60 text-center space-y-1">
                <p className="text-3xl sm:text-4xl font-black text-emerald-400">&lt; 1s</p>
                <p className="text-xs font-semibold text-slate-300">Menu Load Time</p>
              </div>
              <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700/60 text-center space-y-1">
                <p className="text-3xl sm:text-4xl font-black text-blue-400">0</p>
                <p className="text-xs font-semibold text-slate-300">App Downloads Needed</p>
              </div>
              <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700/60 text-center space-y-1">
                <p className="text-3xl sm:text-4xl font-black text-amber-400">24/7</p>
                <p className="text-xs font-semibold text-slate-300">Live KOT Order Stream</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Simple & transparent</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Plans that grow with your cafe</h2>
            <p className="text-sm text-slate-500">Straightforward pricing in USD. Start with Basic, grow with Pro, or pay once for Lifetime access.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {[
              { name: 'Basic', price: '$9', period: '/ month', desc: 'Everything to get started', features: ['Digital menu', 'QR codes for tables', 'Live order dashboard', 'Menu and price management'] },
              { name: 'Pro', price: '$19', period: '/ month', desc: 'For growing restaurants', features: ['Everything in Basic', 'Unlimited tables and menu items', 'Kitchen order notifications', 'Advanced analytics', 'Priority support', 'Custom branding'], popular: true },
              { name: 'Lifetime', price: '$299', period: ' one time', desc: 'One payment. Yours forever.', features: ['Everything in Pro', 'No monthly renewals', 'Lifetime access', 'Future core feature updates'], lifetime: true },
            ].map((plan) => (
              <div key={plan.name} className={`relative p-7 rounded-3xl border flex flex-col ${plan.popular || plan.lifetime ? 'bg-slate-900 text-white border-brand-500 border-2 shadow-xl' : 'bg-white text-slate-900 border-slate-200 shadow-card'}`}>
                {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-brand-500 text-white text-[10px] font-extrabold uppercase">Most popular</span>}
                {plan.lifetime && <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase">One-time ownership</span>}
                <h3 className={`text-sm font-extrabold ${plan.popular || plan.lifetime ? 'text-brand-400' : 'text-slate-600'}`}>{plan.name}</h3>
                <p className="mt-4 text-4xl font-black">{plan.price}<span className={`text-xs font-semibold ${plan.popular || plan.lifetime ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span></p>
                <p className={`mt-2 text-xs ${plan.popular || plan.lifetime ? 'text-slate-400' : 'text-slate-500'}`}>{plan.desc}</p>
                <ul className={`mt-6 mb-7 space-y-3 border-t pt-5 flex-1 ${plan.popular || plan.lifetime ? 'border-slate-700' : 'border-slate-100'}`}>
                  {plan.features.map((feature) => <li key={feature} className={`flex items-start gap-2 text-xs ${plan.popular || plan.lifetime ? 'text-slate-300' : 'text-slate-600'}`}><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />{feature}</li>)}
                </ul>
                <Link to="/register" className={`block text-center w-full py-3 rounded-xl text-xs font-extrabold transition-all ${plan.popular || plan.lifetime ? 'bg-brand-500 hover:bg-brand-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>Get Started</Link>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-7">Create your owner account first, then select your plan from Dashboard → Billing & Plans.</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Got Questions?
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-subtle transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      activeFaq === idx ? 'rotate-180 text-brand-500' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-gradient-to-tr from-brand-600 via-amber-600 to-brand-700 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ready to upgrade your restaurant to digital ordering?
          </h2>
          <p className="text-sm sm:text-base text-amber-100 max-w-xl mx-auto leading-relaxed">
            Join modern restaurateurs saving thousands on printing costs while delighting their diners with instant QR menus.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-sm shadow-xl hover:scale-105 transition-all"
            >
              Get Started Free Today
            </Link>
            <Link
              to="/menu/royal-biryani?table=T-01"
              target="_blank"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-950/40 hover:bg-slate-950/60 text-white font-bold text-sm border border-white/20 transition-all"
            >
              View Live Customer Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
