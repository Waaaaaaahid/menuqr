import React, { useState, useEffect } from 'react';
import { Store, Upload, Save, CheckCircle, Image as ImageIcon } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

export default function SettingsPage() {
  const { restaurant, setRestaurant } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine: '',
    phone: '',
    googleReviewUrl: '',
    email: '',
    openingHours: '',
    announcement: '',
    currencySymbol: '$',
    currencyCode: 'USD',
    taxPercentage: 5,
    serviceChargePercentage: 0,
    tableOrderingEnabled: true,
    isOpen: true,
    street: '',
    city: '',
    state: '',
    zip: '',
    logo: '',
    coverImage: '',
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : '',
        phone: restaurant.phone || '',
        googleReviewUrl: restaurant.googleReviewUrl || '',
        email: restaurant.email || '',
        openingHours: restaurant.openingHours || '',
        announcement: restaurant.announcement || '',
        currencySymbol: restaurant.currency?.symbol || '$',
        currencyCode: restaurant.currency?.code || 'USD',
        taxPercentage: restaurant.taxPercentage ?? 5,
        serviceChargePercentage: restaurant.serviceChargePercentage ?? 0,
        tableOrderingEnabled: restaurant.tableOrderingEnabled ?? true,
        isOpen: restaurant.isOpen ?? true,
        street: restaurant.address?.street || '',
        city: restaurant.address?.city || '',
        state: restaurant.address?.state || '',
        zip: restaurant.address?.zip || '',
        logo: restaurant.logo || '',
        coverImage: restaurant.coverImage || '',
      });
    }
  }, [restaurant]);

  const handleFileUpload = async (e, field) => {
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
        setFormData((prev) => ({ ...prev, [field]: res.data.url }));
        addToast('Uploaded successfully!', 'success');
      }
    } catch (err) {
      addToast('Image upload failed', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        cuisine: formData.cuisine.split(',').map((c) => c.trim()).filter(Boolean),
        phone: formData.phone,
        googleReviewUrl: formData.googleReviewUrl,
        email: formData.email,
        openingHours: formData.openingHours,
        announcement: formData.announcement,
        currency: {
          symbol: formData.currencySymbol,
          code: formData.currencyCode,
          position: 'before',
        },
        taxPercentage: Number(formData.taxPercentage),
        serviceChargePercentage: Number(formData.serviceChargePercentage),
        tableOrderingEnabled: formData.tableOrderingEnabled,
        isOpen: formData.isOpen,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        },
        logo: formData.logo,
        coverImage: formData.coverImage,
      };

      const res = await api.put('/restaurant/me', payload);
      if (res.data.success) {
        setRestaurant(res.data.restaurant);
        addToast('Restaurant profile updated successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to update settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Restaurant Settings & Profile</h2>
        <p className="text-xs text-slate-500">
          Customize your public branding, dining hours, tax configurations, and order preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Brand Info */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Branding & Restaurant Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cuisine Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Italian, Pasta, Artisan Pizza"
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Story
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Announcement Banner (Shown at top of diner menu)
              </label>
              <input
                type="text"
                placeholder="e.g. 🌟 Weekend Special: 20% off all chef signature dishes!"
                value={formData.announcement}
                onChange={(e) => setFormData({ ...formData, announcement: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Logo & Cover Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Logo URL or Upload
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <label className="cursor-pointer px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cover Photo URL or Upload
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <label className="cursor-pointer px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'coverImage')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Currency & Tax Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Financial & Ordering Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Currency Symbol
              </label>
              <select
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="$">$ (USD / CAD / AUD)</option>
                <option value="₹">₹ (INR)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="AED">AED (Emirati Dirham)</option>
                <option value="¥">¥ (JPY / CNY)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tax Percentage (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.taxPercentage}
                onChange={(e) => setFormData({ ...formData, taxPercentage: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Service Charge (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.serviceChargePercentage}
                onChange={(e) =>
                  setFormData({ ...formData, serviceChargePercentage: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Enable Table Ordering</h4>
              <p className="text-[11px] text-slate-500">
                When enabled, diners can place orders from their phones. When disabled, the menu is view-only.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.tableOrderingEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, tableOrderingEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>
        </div>

        {/* Location & Opening Hours */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Contact & Location Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Google Review Link</label>
              <input
                type="url"
                placeholder="Paste your Google Business Profile review link"
                value={formData.googleReviewUrl}
                onChange={(e) => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <p className="text-[11px] text-slate-500 mt-1">Customers will see this link after their order is marked Served.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Opening Hours
              </label>
              <input
                type="text"
                placeholder="Mon - Sun: 11:00 AM - 11:00 PM"
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                placeholder="450 Grand Avenue"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State / Province</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving Changes...' : 'Save Restaurant Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
