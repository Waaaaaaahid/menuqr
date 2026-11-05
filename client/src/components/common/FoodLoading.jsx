import React from 'react';

export default function FoodLoading({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="h-11 w-11 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-slate-500">{message}</p>
      </div>
    </div>
  );
}
