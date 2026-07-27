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
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const Symbol = (
    <svg
      className={`${iconSizes[size]} shrink-0 transition-transform duration-200`}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer Government Welfare Shield Emblem */}
      <path
        d="M18 3L6 8V17C6 25.28 11.12 32.65 18 35C24.88 32.65 30 25.28 30 17V8L18 3Z"
        fill="#1A56DB"
      />
      {/* Subtle Saffron Crest Notch */}
      <circle cx="18" cy="8.5" r="2.2" fill="#FF9933" />
      {/* Document Sheet */}
      <rect
        x="11"
        y="12"
        width="14"
        height="15"
        rx="2"
        fill="#FFFFFF"
      />
      {/* Document Lines */}
      <line
        x1="14"
        y1="15.5"
        x2="22"
        y2="15.5"
        stroke="#1E3A8A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="18.5"
        x2="19"
        y2="18.5"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Verified Scheme Emerald Green Checkmark */}
      <path
        d="M13.5 22.5L16 25L21.5 19.5"
        stroke="#059669"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{Symbol}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {Symbol}
      <span className={`${textSizes[size]} font-bold tracking-tight font-sans`}>
        <span className="text-slate-100">GovScheme</span>
        <span className="text-[#38BDF8] ml-0.5 font-extrabold">AI</span>
      </span>
    </div>
  );
};

export default Logo;
