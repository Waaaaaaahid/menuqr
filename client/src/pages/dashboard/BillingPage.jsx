import React, { useEffect, useState } from 'react';
import { Check, CreditCard, Crown, Loader2, ShieldCheck } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../components/common/Toast';

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

export default function BillingPage() {
  const { addToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState('');
  const [fetching, setFetching] = useState(true);

  const refresh = async () => {
    const [planRes, subRes] = await Promise.all([api.get('/subscriptions/plans'), api.get('/subscriptions/me')]);
    setPlans(planRes.data.plans || []);
    setCurrent(subRes.data.subscription || null);
  };

  useEffect(() => {
    refresh().catch((error) => addToast(error.response?.data?.message || 'Could not load subscription plans.', 'error'))
      .finally(() => setFetching(false));
  }, []);

  const choosePlan = async (plan) => {
    try {
      setLoading(plan.id);
      const result = await api.post('/subscriptions/checkout', { plan: plan.id });
      if (result.data.free) {
        addToast('Free plan activated successfully.', 'success');
        await refresh();
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Razorpay checkout could not be loaded. Please check your connection.');
      const options = {
        key: result.data.keyId,
        subscription_id: result.data.subscriptionId,
        name: 'MenuQR',
        description: `${plan.name} monthly subscription`,
        image: '/favicon.ico',
        prefill: result.data.prefill,
        theme: { color: '#f59e0b' },
        handler: async (response) => {
          try {
            await api.post('/subscriptions/verify', response);
            addToast('Payment verified. Subscription activation will reflect shortly.', 'success');
            await refresh();
          } catch (error) {
            addToast(error.response?.data?.message || 'Could not verify this payment.', 'error');
          } finally { setLoading(''); }
        },
        modal: { ondismiss: () => setLoading('') },
      };
      const checkout = new window.Razorpay(options);
      checkout.on('payment.failed', (event) => {
        addToast(event.error?.description || 'Payment failed. Please try again.', 'error');
        setLoading('');
      });
      checkout.open();
    } catch (error) {
      addToast(error.response?.data?.message || error.message || 'Unable to start checkout.', 'error');
      setLoading('');
    }
  };

  if (fetching) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-6xl space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">MenuQR Plans</p>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Billing & Subscription</h1>
          <p className="text-sm text-slate-500 mt-1">Choose the tools your restaurant needs. Payments are securely processed by Razorpay.</p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl"><ShieldCheck className="w-4 h-4" /> Secure recurring payments</div>
      </div>

      {current && <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 flex flex-wrap justify-between gap-3">
        <div><p className="text-xs text-brand-700 font-semibold">Current plan</p><p className="text-lg font-black text-slate-900 capitalize">{current.plan} · {current.status}</p></div>
        <p className="text-xs text-slate-500 self-center">Last updated {new Date(current.updatedAt || current.createdAt).toLocaleDateString()}</p>
      </div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const featured = plan.id === 'pro';
          return <section key={plan.id} className={`rounded-2xl border p-5 bg-white flex flex-col shadow-sm ${featured ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between"><span className="text-sm font-extrabold text-slate-900">{plan.name}</span>{featured ? <Crown className="w-5 h-5 text-amber-500" /> : <CreditCard className="w-5 h-5 text-slate-400" />}</div>
            <p className="mt-4 text-3xl font-black text-slate-950">{plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}<span className="text-xs font-semibold text-slate-400">{plan.price ? '/month' : ' forever'}</span></p>
            <ul className="space-y-3 mt-5 mb-7 flex-1">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-xs text-slate-600"><Check className="w-4 h-4 text-emerald-500 shrink-0" />{feature}</li>)}</ul>
            <button disabled={!!loading} onClick={() => choosePlan(plan)} className={`w-full rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60 ${featured ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>
              {loading === plan.id && <Loader2 className="w-4 h-4 animate-spin" />}{plan.id === 'free' ? 'Choose Free' : 'Subscribe with Razorpay'}
            </button>
          </section>;
        })}
      </div>
      <p className="text-[11px] text-slate-400">Subscription prices are configurable in your backend environment. Razorpay Key ID, Key Secret and Webhook Secret must be added to Render before live payments can work.</p>
    </div>
  );
}
