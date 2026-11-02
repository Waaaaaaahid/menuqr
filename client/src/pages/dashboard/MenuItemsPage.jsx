import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Flame,
  Star,
  Sparkles,
  Upload,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { formatCurrency } from '../../utils/formatters';
import { DietaryBadge, TagBadge } from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export default function MenuItemsPage() {
  const { restaurant } = useAuth();
  const { addToast } = useToast();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sampleMenuLoading, setSampleMenuLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [vegFilter, setVegFilter] = useState('all'); // all, veg, non-veg

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    isVeg: true,
    isBestseller: false,
    isSpicy: false,
    spiceLevel: 1,
    isNewItem: false,
    preparationTime: '15-20 min',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, catRes] = await Promise.all([
        api.get('/menu-items'),
        api.get('/categories'),
      ]);

      if (itemsRes.data.success) setItems(itemsRes.data.items);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      addToast('Failed to load menu items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImportSampleMenu = async () => {
    const confirmed = window.confirm(
      'Add a sample menu with 16 categories and up to 160 dishes at placeholder INR prices? Existing menu items and orders will not be deleted or overwritten. You can edit the sample dishes and prices afterward.'
    );
    if (!confirmed) return;

    try {
      setSampleMenuLoading(true);
      const res = await api.post('/categories/import-sample-menu');
      if (res.data.success) {
        await fetchData();
        addToast(
          `Added ${res.data.categoriesCreated} categories and ${res.data.itemsCreated} sample dishes. Review prices before publishing.`,
          'success'
        );
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not import the sample menu', 'error');
    } finally {
      setSampleMenuLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: categories.length > 0 ? categories[0]._id : '',
      image: '',
      isVeg: true,
      isBestseller: false,
      isSpicy: false,
      spiceLevel: 1,
      isNewItem: false,
      preparationTime: '15-20 min',
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category?._id || item.category,
      image: item.image || '',
      isVeg: item.isVeg,
      isBestseller: item.isBestseller || false,
      isSpicy: item.isSpicy || false,
      spiceLevel: item.spiceLevel || 1,
      isNewItem: item.isNewItem || false,
      preparationTime: item.preparationTime || '15-20 min',
    });
    setModalOpen(true);
  };

  const handleToggleAvailability = async (item) => {
    try {
      const res = await api.patch(`/menu-items/${item._id}/toggle-availability`);
      if (res.data.success) {
        setItems((prev) =>
          prev.map((i) => (i._id === item._id ? { ...i, isAvailable: res.data.isAvailable } : i))
        );
        addToast(res.data.message, 'success');
      }
    } catch (err) {
      addToast('Failed to toggle availability', 'error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this dish from your menu?')) return;
    try {
      const res = await api.delete(`/menu-items/${itemId}`);
      if (res.data.success) {
        setItems((prev) => prev.filter((i) => i._id !== itemId));
        addToast('Dish deleted successfully', 'success');
      }
    } catch (err) {
      addToast('Failed to delete dish', 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);

    try {
      addToast('Uploading image...', 'info');
      const res = await api.post('/restaurant/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setFormData((prev) => ({ ...prev, image: res.data.url }));
        addToast('Image uploaded successfully', 'success');
      }
    } catch (err) {
      addToast('Image upload failed', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      addToast('Please fill in dish name, price, and category', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingItem) {
        const res = await api.put(`/menu-items/${editingItem._id}`, formData);
        if (res.data.success) {
          setItems((prev) =>
            prev.map((i) => (i._id === editingItem._id ? res.data.item : i))
          );
          addToast('Dish updated successfully', 'success');
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/menu-items', formData);
        if (res.data.success) {
          setItems((prev) => [res.data.item, ...prev]);
          addToast('Dish added successfully', 'success');
          setModalOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Error saving dish', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Items logic
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      !selectedCategory || (item.category?._id || item.category) === selectedCategory;

    const matchesVeg =
      vegFilter === 'all' ? true : vegFilter === 'veg' ? item.isVeg : !item.isVeg;

    return matchesSearch && matchesCategory && matchesVeg;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Food Menu Management</h2>
          <p className="text-xs text-slate-500">
            Create, update pricing, upload images, and control dish availability in real-time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleImportSampleMenu}
            disabled={sampleMenuLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs transition-all disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            {sampleMenuLoading ? 'Adding Sample Menu...' : 'Add Sample Menu'}
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Food Item
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dish name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Veg / Non-Veg filter toggle pills */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setVegFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vegFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setVegFilter('veg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                vegFilter === 'veg'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DietaryBadge isVeg={true} />
              Veg
            </button>
            <button
              onClick={() => setVegFilter('non-veg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                vegFilter === 'non-veg'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DietaryBadge isVeg={false} />
              Non-Veg
            </button>
          </div>
        </div>
      </div>

      {/* Items List / Cards */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Plus}
          title={search || selectedCategory ? 'No dishes match your filter' : 'Your menu is empty'}
          description={
            search || selectedCategory
              ? 'Try clearing your search query or switching categories.'
              : 'Add your first signature dish to present on your digital contactless menu!'
          }
          actionText={search || selectedCategory ? 'Clear Filters' : 'Add First Dish'}
          onAction={() => {
            if (search || selectedCategory) {
              setSearch('');
              setSelectedCategory('');
              setVegFilter('all');
            } else {
              openAddModal();
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className={`bg-white rounded-2xl border transition-all shadow-card hover:shadow-dropdown flex flex-col justify-between overflow-hidden group ${
                !item.isAvailable ? 'opacity-65 border-slate-200' : 'border-slate-200/90'
              }`}
            >
              {/* Image Container with Badges */}
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                    <ImageIcon className="w-8 h-8 stroke-1 mb-1" />
                    <span className="text-[10px] font-medium">No photo uploaded</span>
                  </div>
                )}

                {/* Dietary badge (Top left) */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <DietaryBadge isVeg={item.isVeg} className="shadow-md" />
                  {item.isBestseller && <TagBadge type="bestseller" />}
                  {item.isSpicy && <TagBadge type="spicy" spiceLevel={item.spiceLevel} />}
                  {item.isNewItem && <TagBadge type="new" />}
                </div>

                {/* Availability status badge */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    title={item.isAvailable ? 'Click to mark Sold Out' : 'Click to mark In Stock'}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md transition-all shadow-xs flex items-center gap-1 ${
                      item.isAvailable
                        ? 'bg-emerald-500/90 text-white border-emerald-400'
                        : 'bg-rose-500/90 text-white border-rose-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    {item.isAvailable ? 'Available' : 'Sold Out'}
                  </button>
                </div>

                {/* Category Pill at bottom left of image */}
                <div className="absolute bottom-2 left-3">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold">
                    {item.category?.name || 'Category'}
                  </span>
                </div>
              </div>

              {/* Item Info Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                      {item.name}
                    </h3>
                    <span className="text-sm font-extrabold text-slate-900 flex-shrink-0">
                      {formatCurrency(item.price, restaurant?.currency)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description || 'Delicious freshly prepared dish.'}
                  </p>
                </div>

                {/* Card Footer: Prep time & actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    ⏱ {item.preparationTime || '15-20 min'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Edit Dish"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Dish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Food Item' : 'Add New Food Item'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dish Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Nizami Biryani"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Price ({restaurant?.currency?.symbol || '$'}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="18.50"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Tell diners about the ingredients, seasoning, and story behind this dish..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Image Upload or URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dish Image URL or File
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <label className="cursor-pointer px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Dietary Type & Promotional Badges */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">Dietary & Menu Badges</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={formData.isVeg}
                  onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                  className="accent-brand-500 rounded"
                />
                <DietaryBadge isVeg={true} />
                <span>Vegetarian</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={formData.isBestseller}
                  onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                  className="accent-brand-500 rounded"
                />
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Bestseller</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={formData.isSpicy}
                  onChange={(e) => setFormData({ ...formData, isSpicy: e.target.checked })}
                  className="accent-brand-500 rounded"
                />
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Spicy</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={formData.isNewItem}
                  onChange={(e) => setFormData({ ...formData, isNewItem: e.target.checked })}
                  className="accent-brand-500 rounded"
                />
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>New Item</span>
              </label>
            </div>

            {formData.isSpicy && (
              <div className="pt-2 flex items-center gap-3 text-xs">
                <span className="font-semibold text-slate-700">Spice Level:</span>
                {[1, 2, 3].map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setFormData({ ...formData, spiceLevel: lvl })}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      formData.spiceLevel === lvl
                        ? 'bg-rose-500 text-white'
                        : 'bg-white border text-slate-600'
                    }`}
                  >
                    {lvl === 1 ? 'Mild 🌶️' : lvl === 2 ? 'Medium 🌶️🌶️' : 'Extra Hot 🔥'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving Dish...' : editingItem ? 'Update Dish' : 'Add Dish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
