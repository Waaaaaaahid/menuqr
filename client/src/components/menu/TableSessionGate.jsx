import React, { useEffect, useState } from 'react';
import { ShieldCheck, Clock3, UtensilsCrossed, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';

const storageKey = (slug, table) => `menuqr_table_session_${slug}_${encodeURIComponent(String(table || '').toLowerCase())}`;

export default function TableSessionGate({ restaurantSlug, tableNumber, tableKey }) {
  const { setTableSessionInfo } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [savedSession, setSavedSession] = useState(null);
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const key = storageKey(restaurantSlug, tableNumber);

  useEffect(() => {
    setTableSessionInfo({ tableNumber: tableNumber || '', token: '' });
    setVerified(false);
    setError('');
    if (!restaurantSlug || !tableNumber || !tableKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved?.sessionToken) {
        setSavedSession(saved);
        setOtp(saved.otp || '');
      } else {
        setSavedSession(null);
      }
    } catch {
      localStorage.removeItem(key);
      setSavedSession(null);
    }
  }, [restaurantSlug, tableNumber, tableKey, key, setTableSessionInfo]);

  useEffect(() => {
    if (!savedSession?.sessionToken || verified || !restaurantSlug || !tableNumber || !tableKey) return;
    let active = true;
    const checkStatus = async () => {
      try {
        setChecking(true);
        const response = await api.post('/public/table-sessions/status', {
          restaurantSlug, tableNumber, tableKey, sessionToken: savedSession.sessionToken,
        });
        if (!active) return;
        if (response.data.verified) {
          setTableSessionInfo({ tableNumber, token: savedSession.sessionToken });
          setVerified(true);
          setOtp('');
          localStorage.setItem(key, JSON.stringify({ sessionToken: savedSession.sessionToken, otp: '', customerName: savedSession.customerName }));
        } else if (response.data.status === 'expired' || response.data.status === 'none') {
          localStorage.removeItem(key);
          setSavedSession(null);
          setOtp('');
          setError('Your verification request expired. Please request a new OTP.');
        }
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 403) {
          localStorage.removeItem(key);
          setSavedSession(null);
          setOtp('');
          setError('This verification request is no longer valid. Please start again.');
        }
      } finally {
        if (active) setChecking(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 2500);
    return () => { active = false; clearInterval(interval); };
  }, [savedSession, verified, restaurantSlug, tableNumber, tableKey, key, setTableSessionInfo]);

  const requestOtp = async (event) => {
    event.preventDefault();
    if (customerName.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const response = await api.post('/public/table-sessions/request', {
        restaurantSlug, tableNumber, tableKey, customerName: customerName.trim(),
      });
      const nextSession = {
        sessionToken: response.data.sessionToken,
        otp: response.data.otp,
        customerName: customerName.trim(),
      };
      localStorage.setItem(key, JSON.stringify(nextSession));
      setSavedSession(nextSession);
      setOtp(response.data.otp);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not request table verification.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!tableNumber || !tableKey || verified) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6 space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Table verification</p>
          <h2 className="text-xl font-black text-slate-900 mt-1">Welcome to your table</h2>
          <p className="text-sm text-slate-500 mt-1">You scanned QR for <strong>{tableNumber}</strong>. Verify with restaurant staff before placing an order.</p>
        </div>

        {!savedSession ? (
          <form onSubmit={requestOtp} className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">Your name</label>
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              maxLength={60}
              autoComplete="name"
              placeholder="Enter your name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500"
            />
            <button disabled={submitting} className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
              {submitting ? 'Generating OTP…' : 'Generate Verification OTP'}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">Your verification OTP</span>
              <Clock3 className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-4xl font-black tracking-[0.3em] text-center text-slate-900 py-2">{otp || '••••••'}</div>
            <p className="text-xs text-amber-900">Tell this code to the staff member at your table. They will verify your name and table before activating ordering.</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              Waiting for staff verification…
            </div>
          </div>
        )}

        {error && <p className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">{error}</p>}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <UtensilsCrossed className="w-3.5 h-3.5" />
          Orders unlock automatically after staff approval.
        </div>
      </div>
    </div>
  );
}
