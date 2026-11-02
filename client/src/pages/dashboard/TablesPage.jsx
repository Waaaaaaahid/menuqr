import React, { useState, useEffect } from 'react';
import {
  Plus,
  QrCode,
  Download,
  Printer,
  Trash2,
  Edit2,
  ExternalLink,
  Users,
  Layers,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import PrintTableCard from '../../components/dashboard/PrintTableCard';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export default function TablesPage() {
  const { restaurant } = useAuth();
  const { addToast } = useToast();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedPrintTable, setSelectedPrintTable] = useState(null);

  // Forms
  const [formData, setFormData] = useState({ tableNumber: '', capacity: 4 });
  const [bulkData, setBulkData] = useState({ prefix: 'T-', start: 1, count: 5, capacity: 4 });
  const [submitting, setSubmitting] = useState(false);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tables');
      if (res.data.success) {
        setTables(res.data.tables);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load tables', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!formData.tableNumber.trim()) {
      addToast('Please enter table number', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/tables', formData);
      if (res.data.success) {
        setTables((prev) => [...prev, res.data.table]);
        addToast('Table created and QR code generated!', 'success');
        setAddModalOpen(false);
        setFormData({ tableNumber: '', capacity: 4 });
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create table', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/tables/bulk', bulkData);
      if (res.data.success) {
        addToast(res.data.message, 'success');
        setBulkModalOpen(false);
        fetchTables();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Bulk creation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseSession = async (tableId, tableNumber) => {
    if (!window.confirm(`Release ${tableNumber} and allow a new customer session?`)) return;
    try {
      const res = await api.post(`/tables/${tableId}/release-session`);
      if (res.data.success) {
        addToast(`${tableNumber} is now available for a new session.`, 'success');
        fetchTables();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not release table session.', 'error');
    }
  };

  const handleDeleteTable = async (tableId, tableNumber) => {
    if (!window.confirm(`Delete table "${tableNumber}"?`)) return;

    try {
      const res = await api.delete(`/tables/${tableId}`);
      if (res.data.success) {
        setTables((prev) => prev.filter((t) => t._id !== tableId));
        addToast('Table deleted', 'success');
      }
    } catch (err) {
      addToast('Failed to delete table', 'error');
    }
  };

  const downloadQrPng = (table) => {
    if (!table.qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = table.qrCodeDataUrl;
    a.download = `${restaurant.slug}-${table.tableNumber}-qr.png`;
    a.click();
    addToast(`Downloaded PNG for ${table.tableNumber}`, 'success');
  };

  const downloadQrSvg = (table) => {
    if (!table.qrCodeSvg) return;
    const blob = new Blob([table.qrCodeSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${restaurant.slug}-${table.tableNumber}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Downloaded SVG for ${table.tableNumber}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dining Tables & QR Codes</h2>
          <p className="text-xs text-slate-500">
            Generate unique table-identifying QR codes. Download PNG/SVG or print stand cards for tables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-all shadow-xs"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            Bulk Create Tables
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : tables.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="No Tables Created"
          description="Create your dining tables to generate table-specific QR codes that diners can scan to place orders directly."
          actionText="Create Tables"
          onAction={() => setAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {tables.map((table) => {
            const tableMenuUrl = `/menu/${restaurant.slug}?table=${encodeURIComponent(table.tableNumber)}&key=${encodeURIComponent(table.qrToken || '')}`;
            return (
              <div
                key={table._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-dropdown transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top: Table Identifier & Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-slate-900">
                        {table.tableNumber}
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {table.capacity} seats
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        table.status === 'occupied'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {table.status === 'occupied' ? 'Occupied' : 'Available'}
                    </span>
                  </div>

                  {/* QR Code Preview Box */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center mb-4 group relative">
                    <img
                      src={table.qrCodeDataUrl}
                      alt={`QR ${table.tableNumber}`}
                      className="w-40 h-40 object-contain rounded-lg shadow-xs group-hover:scale-105 transition-transform"
                    />

                    <div className="mt-2 text-[10px] text-slate-400 font-semibold truncate max-w-[200px]">
                      ?table={table.tableNumber}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {table.session?.status === 'active' && (
                    <button
                      onClick={() => handleReleaseSession(table._id, table.tableNumber)}
                      className="w-full px-3 py-2 rounded-lg text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
                    >
                      Release Verified Table Session
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedPrintTable(table)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Stand
                    </button>
                    <a
                      href={tableMenuUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 text-[11px] font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Test Scan
                    </a>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadQrPng(table)}
                        className="hover:text-slate-800 font-semibold"
                        title="Download high-res PNG"
                      >
                        PNG
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => downloadQrSvg(table)}
                        className="hover:text-slate-800 font-semibold"
                        title="Download vector SVG"
                      >
                        SVG
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteTable(table._id, table.tableNumber)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Delete Table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Single Table Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Dining Table"
      >
        <form onSubmit={handleAddTable} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Table Number or Label *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. T-07 or Patio 2 or Bar 1"
              value={formData.tableNumber}
              onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Seating Capacity
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Generating...' : 'Create Table & QR'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Create Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Bulk Generate Tables"
      >
        <form onSubmit={handleBulkCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prefix
              </label>
              <input
                type="text"
                value={bulkData.prefix}
                onChange={(e) => setBulkData({ ...bulkData, prefix: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Number
              </label>
              <input
                type="number"
                min="1"
                value={bulkData.start}
                onChange={(e) => setBulkData({ ...bulkData, start: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Number of Tables
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={bulkData.count}
                onChange={(e) => setBulkData({ ...bulkData, count: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Seats per Table
              </label>
              <input
                type="number"
                min="1"
                value={bulkData.capacity}
                onChange={(e) => setBulkData({ ...bulkData, capacity: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-xs">
            Will generate {bulkData.count} tables: {bulkData.prefix}
            {bulkData.start < 10 ? `0${bulkData.start}` : bulkData.start} through{' '}
            {bulkData.prefix}
            {Number(bulkData.start) + Number(bulkData.count) - 1 < 10
              ? `0${Number(bulkData.start) + Number(bulkData.count) - 1}`
              : Number(bulkData.start) + Number(bulkData.count) - 1}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBulkModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {submitting ? 'Generating Tables...' : 'Generate All Tables'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Print Table Stand Modal */}
      {selectedPrintTable && (
        <PrintTableCard
          table={selectedPrintTable}
          restaurant={restaurant}
          onClose={() => setSelectedPrintTable(null)}
        />
      )}
    </div>
  );
}
