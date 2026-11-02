import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Search, Sparkles, AlertCircle, QrCode, Store, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import RestaurantHeader from '../../components/menu/RestaurantHeader';
import FoodCard from '../../components/menu/FoodCard';
import FoodDetailModal from '../../components/menu/FoodDetailModal';
import CartDrawer from '../../components/menu/CartDrawer';
import Modal from '../../components/common/Modal';
import { DietaryBadge } from '../../components/common/Badge';
import { getCustomerActiveOrder, saveCustomerActiveOrder, clearCustomerActiveOrder, isCustomerOrderActive } from '../../utils/customerOrders';

export default function PublicMenuPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get('table');
  const tableKey = searchParams.get('key');

  const {
    setRestaurantSlug,
    tableNumber,
    setTableNumber,
    setTableToken,
    items: cartItems,
    addToCart,
    updateQuantity,
  } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [bestsellerOnly, setBestsellerOnly] = useState(false);

  // Modals & Drawers
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedDishDetail, setSelectedDishDetail] = useState(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tempTableInput, setTempTableInput] = useState('');

  const categoryRefs = useRef({});

  // Sync slug and table
  useEffect(() => {
    if (slug) {
      setRestaurantSlug(slug);
    }
    if (tableParam) setTableNumber(tableParam);
    if (tableKey) setTableToken(tableKey);
  }, [slug, tableParam, tableKey, setRestaurantSlug, setTableNumber, setTableToken]);

  // Fetch Public Menu Data
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/public/menu/${slug}${tableParam ? `?table=${encodeURIComponent(tableParam)}&key=${encodeURIComponent(tableKey || '')}` : ''}`);

        if (res.data.success) {
          setRestaurant(res.data.restaurant);
          setCategories(res.data.categories);
          setMenuItems(res.data.menuItems);

          // Log anonymous visit for analytics
          api.post('/public/analytics/view', {
            restaurantId: res.data.restaurant.id,
            tableNumber: tableParam || '',
          }).catch(() => {});
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Restaurant menu not found.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMenu();
    }
  }, [slug, tableParam]);

  // Restore and verify this customer's active order on this device.
  useEffect(() => {
    if (!restaurant || !slug) return;
    const savedOrder = getCustomerActiveOrder(slug);
    if (!savedOrder?.orderId) {
      setActiveOrder(null);
      return;
    }

    setActiveOrder(savedOrder);
    let isMounted = true;
    api.get(`/public/orders/${savedOrder.orderId}`)
      .then((res) => {
        if (!isMounted || !res.data?.success) return;
        const latestOrder = res.data.order;
        if (!isCustomerOrderActive(latestOrder.status)) {
          clearCustomerActiveOrder(slug, savedOrder.orderId);
          setActiveOrder(null);
          return;
        }
        const refreshed = {
          ...savedOrder,
          status: latestOrder.status,
          orderNumber: latestOrder.orderNumber || savedOrder.orderNumber,
        };
        saveCustomerActiveOrder(slug, refreshed);
        setActiveOrder(refreshed);
      })
      .catch(() => {
        // Keep the saved link available if the network is temporarily unavailable.
      });

    return () => { isMounted = false; };
  }, [restaurant, slug]);

  const scrollToCategory = (catId) => {
    setActiveCategory(catId);
    if (catId === 'all') {
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }
    const elem = categoryRefs.current[catId];
    if (elem) {
      const yOffset = -120;
      const y = elem.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleSaveTable = (e) => {
    e.preventDefault();
    if (tempTableInput.trim()) {
      setTableNumber(tempTableInput.trim());
      setTableModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-700">Loading delicious digital menu...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Menu Unavailable</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'The digital menu you are looking for does not exist or has been modified.'}
          </p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            Go to MenuQR Home
          </Link>
        </div>
      </div>
    );
  }

  // Filter items logic
  const filteredDishes = menuItems.filter((dish) => {
    const matchesSearch =
      dish.name.toLowerCase().includes(search.toLowerCase()) ||
      (dish.description && dish.description.toLowerCase().includes(search.toLowerCase()));

    const matchesVeg = vegOnly ? dish.isVeg : true;
    const matchesBestseller = bestsellerOnly ? dish.isBestseller : true;

    return matchesSearch && matchesVeg && matchesBestseller;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Top Restaurant Header */}
      <RestaurantHeader
        restaurant={restaurant}
        tableNumber={tableNumber}
        onSelectTable={() => {}}
        activeOrder={activeOrder}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        {/* Sticky Search and Filters */}
        <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md pt-2 pb-3 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search dishes in ${restaurant.name}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-xs bg-white border border-slate-200 shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Filter Pills Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => scrollToCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              All Dishes
            </button>

            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => scrollToCategory(cat._id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat._id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}

            <div className="h-5 w-[1px] bg-slate-300 flex-shrink-0 mx-1"></div>

            {/* Quick Dietary toggles */}
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                vegOnly
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              <DietaryBadge isVeg={true} />
              Veg Only
            </button>

            <button
              onClick={() => setBestsellerOnly(!bestsellerOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                bestsellerOnly
                  ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              ★ Bestsellers
            </button>
          </div>
        </div>

        {/* Categories & Dishes Section */}
        {filteredDishes.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
            <p className="text-sm font-bold text-slate-700">No dishes match your search or filter</p>
            <p className="text-xs text-slate-400 mt-1">Try searching for another dish or clearing filters</p>
            <button
              onClick={() => {
                setSearch('');
                setVegOnly(false);
                setBestsellerOnly(false);
                setActiveCategory('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((category) => {
              const categoryDishes = filteredDishes.filter(
                (d) => (d.category?._id || d.category) === category._id
              );

              if (categoryDishes.length === 0) return null;

              return (
                <div
                  key={category._id}
                  ref={(el) => (categoryRefs.current[category._id] = el)}
                  className="space-y-3.5 scroll-mt-24"
                >
                  <div className="border-b border-slate-200/80 pb-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{category.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {categoryDishes.map((dish) => {
                      const cartItem = cartItems.find((i) => i._id === dish._id);
                      return (
                        <FoodCard
                          key={dish._id}
                          dish={dish}
                          currency={restaurant.currency}
                          cartItem={cartItem}
                          onAddToCart={(d, q) => addToCart(d, q)}
                          onUpdateQuantity={(id, q) => updateQuantity(id, q)}
                          onOpenDetail={(d) => setSelectedDishDetail(d)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Food Detail Modal */}
      {selectedDishDetail && (
        <FoodDetailModal
          dish={selectedDishDetail}
          currency={restaurant.currency}
          cartItem={cartItems.find((i) => (i.menuItemId || i._id) === selectedDishDetail._id)}
          isOpen={!!selectedDishDetail}
          onClose={() => setSelectedDishDetail(null)}
          onAddToCart={(d, q, inst, size) => addToCart(d, q, inst, size)}
        />
      )}

      {/* Cart Drawer & Bottom Floating Bar */}
      <CartDrawer
        restaurant={restaurant}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onOpen={() => setCartOpen(true)}
      />

      {/* Table Selection Modal */}
      <Modal
        isOpen={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
        title="Set Your Dining Table"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSaveTable} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Please enter your table number (usually found on the tent card or acrylic stand at your table) so our staff can bring your order right to you.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Table Number or Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. T-01, Patio 2, Bar 3"
              value={tempTableInput}
              onChange={(e) => setTempTableInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setTableModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20"
            >
              Set Table
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
