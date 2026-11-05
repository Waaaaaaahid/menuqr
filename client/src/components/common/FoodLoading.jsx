import React from 'react';

export default function FoodLoading() {
  return (
    <div className="food-loading-screen" role="status" aria-live="polite" aria-label="Preparing your menu">
      <div className="premium-loader">
        <div className="premium-loader-mark" aria-hidden="true">
          <span className="premium-plate premium-plate-outer" />
          <span className="premium-plate premium-plate-inner" />
          <span className="premium-loader-orbit" />
          <span className="premium-loader-spark">✦</span>
        </div>
        <div className="premium-loader-wordmark">menu<span>qr</span></div>
        <p className="premium-loader-caption">A better way to dine</p>
        <div className="premium-loader-status">Preparing your experience<span className="premium-loader-dots"><i /><i /><i /></span></div>
      </div>
    </div>
  );
}
