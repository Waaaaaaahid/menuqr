import React, { useEffect, useState } from 'react';

const FOOD_STAGES = ['burger', 'pizza', 'drinks', 'fries'];

function FoodIllustration({ type }) {
  const common = { stroke: '#4b3024', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' };

  if (type === 'burger') return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="bun" x1="20" y1="30" x2="95" y2="78" gradientUnits="userSpaceOnUse"><stop stopColor="#FFD77A"/><stop offset="1" stopColor="#E99435"/></linearGradient>
        <linearGradient id="lettuce" x1="24" y1="58" x2="96" y2="72" gradientUnits="userSpaceOnUse"><stop stopColor="#9BD65C"/><stop offset="1" stopColor="#4E9B43"/></linearGradient>
      </defs>
      <path d="M18 56C18 35 36 19 60 19s42 16 42 37v5H18v-5Z" fill="url(#bun)" {...common}/>
      <g fill="#FFF0B5"><ellipse cx="43" cy="35" rx="2" ry="1.2" transform="rotate(-25 43 35)"/><ellipse cx="60" cy="29" rx="2" ry="1.2"/><ellipse cx="77" cy="36" rx="2" ry="1.2" transform="rotate(25 77 36)"/><ellipse cx="32" cy="47" rx="2" ry="1.2"/><ellipse cx="88" cy="47" rx="2" ry="1.2"/></g>
      <path d="m19 61 8-5 8 5 9-5 9 5 9-5 9 5 9-5 9 5 8-5 4 7-8 7H25l-8-7Z" fill="url(#lettuce)" {...common}/>
      <path d="M23 69h74l-4 10H27l-4-10Z" fill="#8D3E2B" {...common}/>
      <path d="M22 80h76c-2 10-17 15-38 15S24 90 22 80Z" fill="url(#bun)" {...common}/>
      <path d="M28 82c16 5 48 5 64 0" stroke="#F8C66B" strokeWidth="2"/>
    </svg>
  );

  if (type === 'pizza') return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path d="M20 23 103 91 14 99 20 23Z" fill="#E9A64B" stroke="#633D26" strokeWidth="3" strokeLinejoin="round"/>
      <path d="m25 31 67 55-72 7 5-62Z" fill="#FFD978"/>
      <path d="m20 23 83 68-11 1-72-59V23Z" fill="#F5C56B" stroke="#633D26" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M29 37 86 83" stroke="#FFF0B4" strokeWidth="3" strokeLinecap="round"/>
      <g fill="#D94D3F" stroke="#A7352C" strokeWidth="1.5"><circle cx="39" cy="48" r="6"/><circle cx="62" cy="65" r="6"/><circle cx="35" cy="78" r="5"/><circle cx="76" cy="82" r="5"/></g>
      <g fill="#4D9B51"><path d="m49 54 7-4-1 8-6 2-3-3 3-3Z"/><path d="m69 42 7-3-2 8-6 1-3-3 4-3Z"/><path d="m51 83 7-4-1 8-6 2-3-3 3-3Z"/></g>
    </svg>
  );

  if (type === 'drinks') return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path d="m25 36 9 67h27l9-67H25Z" fill="#F5A34C" stroke="#58382B" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="m31 55 5 42h22l6-42H31Z" fill="#F7D36A"/>
      <path d="m42 13 13 3-9 44-8-2 4-45Z" fill="#F4F0DD" stroke="#58382B" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M72 43h27l-4 60H76l-4-60Z" fill="#E96D72" stroke="#58382B" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M75 62h21l-3 36H78l-3-36Z" fill="#FFB5A1"/>
      <path d="M78 14 91 17 85 51l-8-2 1-35Z" fill="#F4F0DD" stroke="#58382B" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M20 35h50M68 42h35" stroke="#58382B" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="48" cy="70" r="3" fill="#FFF3C4"/><circle cx="85" cy="78" r="3" fill="#FFF3C4"/>
    </svg>
  );

  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path d="M35 24h51l-5 78H40l-5-78Z" fill="#F5C34F" stroke="#583B28" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M39 31h43l-4 65H44l-5-65Z" fill="#FFD978"/>
      <path d="M35 24h51l-2 13H37l-2-13Z" fill="#E9A83E" stroke="#583B28" strokeWidth="2"/>
      <path d="m43 20 4-10 5 10 5-10 5 10 5-10 5 10 5-10 5 10" fill="#F4C44D" stroke="#583B28" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M47 45h28M46 57h28M45 69h28M44 81h28" stroke="#E7A93B" strokeWidth="2" strokeLinecap="round"/>
      <path d="M30 101h61" stroke="#583B28" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

export default function FoodLoading({ message = 'Freshly made, just for you.' }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setStage((current) => (current + 1) % FOOD_STAGES.length), 1500);
    return () => window.clearInterval(timer);
  }, []);

  const current = FOOD_STAGES[stage];
  return (
    <div className="food-loading-screen" role="status" aria-live="polite" aria-label={message}>
      <div className="food-loader-content">
        <div className="food-loader-art" key={current}>
          <FoodIllustration type={current} />
          <FoodIllustration type={current} />
        </div>
        <p className="food-loader-copy">{message}</p>
      </div>
    </div>
  );
}
