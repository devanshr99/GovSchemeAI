import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
}) => {
  const iconSizes = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  };

  const Symbol = (
    <svg
      className={`${iconSizes[size]} shrink-0 transition-transform duration-200`}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Handcrafted Government Emblem: File + Shield + Chakra Geometry + Welfare Checkmark */}
      {/* Outer Shield Frame */}
      <path
        d="M20 4L7 9.5V19C7 27.5 12.5 34.8 20 37.5C27.5 34.8 33 27.5 33 19V9.5L20 4Z"
        fill="url(#govShieldGradient)"
        stroke="#1D4ED8"
        strokeWidth="1.8"
      />
      {/* Inner Document Body */}
      <rect
        x="13"
        y="12"
        width="14"
        height="17"
        rx="2"
        fill="#0F172A"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        opacity="0.9"
      />
      {/* Document Lines */}
      <line x1="16" y1="16" x2="24" y2="16" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="19" x2="22" y2="19" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
      
      {/* Subtle India Geometric Wheel (Chakra Motif) */}
      <circle cx="20" cy="10.5" r="2.2" stroke="#E06D10" strokeWidth="1.2" fill="none" />
      <circle cx="20" cy="10.5" r="0.6" fill="#E06D10" />

      {/* Welfare Checkmark */}
      <path
        d="M15 24L18.5 27.5L25 21"
        stroke="#10B981"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <defs>
        <linearGradient id="govShieldGradient" x1="20" y1="4" x2="20" y2="37.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#123B7A" />
          <stop offset="1" stopColor="#0A2540" />
        </linearGradient>
      </defs>
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{Symbol}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {Symbol}
      <span className={`${textSizes[size]} font-bold tracking-tight font-sans flex items-baseline`}>
        <span className="text-slate-100 font-extrabold">GovScheme</span>
        <span className="text-slate-400 font-semibold text-[0.85em] ml-0.5 uppercase tracking-wider">AI</span>
      </span>
    </div>
  );
};

export default Logo;

