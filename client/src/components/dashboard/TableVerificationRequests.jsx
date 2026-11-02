import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Clock3, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../common/Toast';

export default function TableVerificationRequests() {
  const [requests, setRequests] = useState([]);
  const [codes, setCodes] = useState({});
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const fetchRequests = useCallback(async () => {
    try {
      const response = await api.get('/tables/verifications');
      if (response.data.success) setRequests(response.data.requests || []);
    } catch (error) {
      console.warn('Could not load table verification requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRequests();
    const interval = setInterval(fetchRequests, 4000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const verify = async (request) => {
    const otp = String(codes[request.tableId] || '').trim();
    if (!/^\d{6}$/.test(otp)) {
      addToast('Enter the 6-digit OTP told by the customer.', 'error');
      return;
    }
    try {
      const response = await api.post(`/tables/${request.tableId}/verify`, { otp });
      if (response.data.success) {
        addToast(response.data.message, 'success');
        setCodes((previous) => ({ ...previous, [request.tableId]: '' }));
        fetchRequests();
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'OTP verification failed.', 'error');
      fetchRequests();
    }
  };

  const reject = async (request) => {
    try {
      const response = await api.post(`/tables/${request.tableId}/reject-verification`);
      if (response.data.success) {
        addToast('Verification request rejected.', 'success');
        fetchRequests();
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'Could not reject request.', 'error');
      fetchRequests();
    }
  };

  if (!requests.length && !loading) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-amber-600" /> Table Verification Requests</h3>
          <p className="text-xs text-slate-600 mt-1">Check that the customer is physically at the displayed table before entering their OTP.</p>
        </div>
        <span className="rounded-full bg-amber-200 px-2.5 py-1 text-[11px] font-black text-amber-900">{requests.length} pending</span>
      </div>
      {loading && !requests.length ? <p className="text-xs text-slate-500">Loading requests…</p> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {requests.map((request) => (
          <div key={request.tableId} className="rounded-xl border border-amber-200 bg-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-black text-slate-900">{request.tableNumber}</p>
                <p className="text-sm font-semibold text-slate-700">{request.customerName}</p>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-1 flex items-center gap-1"><Clock3 className="w-3 h-3" /> Pending</span>
            </div>
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                maxLength={6}
                value={codes[request.tableId] || ''}
                onChange={(event) => setCodes((previous) => ({ ...previous, [request.tableId]: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="Enter 6-digit OTP"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm tracking-widest font-bold"
              />
              <button onClick={() => reject(request)} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">Reject</button>
              <button onClick={() => verify(request)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">Verify</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={fetchRequests} className="text-xs font-semibold text-slate-600 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Refresh requests</button>
    </section>
  );
}
