// Currency formatter helper
export const formatCurrency = (amount, currency = { symbol: '$', position: 'before' }) => {
  const num = Number(amount) || 0;
  const formattedNum = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const symbol = currency?.symbol || '$';
  if (currency?.position === 'after') {
    return `${formattedNum} ${symbol}`;
  }
  return `${symbol}${formattedNum}`;
};

// Date formatter
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Time / relative time formatter
export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes === 1) return '1 min ago';
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return '1 hour ago';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  return formatDate(dateStr);
};

// Order status colors & badge config
export const getOrderStatusInfo = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return {
        label: 'Pending',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        badgeBg: 'bg-amber-500',
        dot: 'bg-amber-500',
        step: 1,
      };
    case 'accepted':
      return {
        label: 'Accepted',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeBg: 'bg-blue-500',
        dot: 'bg-blue-500',
        step: 2,
      };
    case 'preparing':
      return {
        label: 'Preparing',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        badgeBg: 'bg-indigo-500',
        dot: 'bg-indigo-500',
        step: 3,
      };
    case 'ready':
      return {
        label: 'Ready for Table',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeBg: 'bg-emerald-500',
        dot: 'bg-emerald-500',
        step: 4,
      };
    case 'completed':
      return {
        label: 'Served',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        badgeBg: 'bg-slate-600',
        dot: 'bg-slate-500',
        step: 5,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        badgeBg: 'bg-rose-500',
        dot: 'bg-rose-500',
        step: 0,
      };
    default:
      return {
        label: status || 'Unknown',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        badgeBg: 'bg-slate-500',
        dot: 'bg-slate-400',
        step: 1,
      };
  }
};
