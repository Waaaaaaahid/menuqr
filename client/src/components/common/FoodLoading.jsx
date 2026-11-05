import React, { useEffect, useState } from 'react';

const FOOD_STAGES = [
  { icon: '🍔', label: 'Burgers' },
  { icon: '🍕', label: 'Pizza' },
  { icon: '🍻', label: 'Drinks' },
  { icon: '🍟', label: 'Fries' },
];

export default function FoodLoading({ message = 'Preparing your experience...' }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStage((current) => (current + 1) % FOOD_STAGES.length);
    }, 1450);
    return () => window.clearInterval(timer);
  }, []);

  const current = FOOD_STAGES[stage];

  return (
    <div className="food-loading-screen" role="status" aria-live="polite" aria-label={message}>
      <div className="food-loader-card">
        <div className="food-loader-orbit food-loader-orbit-one" />
        <div className="food-loader-orbit food-loader-orbit-two" />
        <div className="food-loader-stack" key={stage}>
          <span className="food-loader-emoji food-loader-emoji-top">{current.icon}</span>
          <span className="food-loader-emoji food-loader-emoji-bottom">{current.icon}</span>
        </div>
        <div className="food-loader-brand">Menu<span>QR</span></div>
        <p className="food-loader-message">{message}</p>
        <div className="food-loader-caption">{current.label}<span className="food-loader-dots">...</span></div>
        <div className="food-loader-progress"><span /></div>
      </div>
    </div>
  );
}
