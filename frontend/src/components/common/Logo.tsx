import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'with-subtitle';
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
    md: 'h-8 sm:h-9 w-8 sm:w-9',
    lg: 'h-10 sm:h-11 w-10 sm:w-11',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  };

  const Symbol = (
    <svg
      className={`${iconSizes[size]} shrink-0 transition-transform duration-300 group-hover:scale-105`}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer Shield - Government Civic Emblem Frame */}
      <path
        d="M20 3.5L7 9.2V18.5C7 26.8 12.4 34 20 36.8C27.6 34 33 26.8 33 18.5V9.2L20 3.5Z"
        fill="url(#civicShieldGradient)"
        stroke="#3B82F6"
        strokeWidth="1.5"
      />
      
      {/* Document Sheet Card */}
      <rect
        x="13.5"
        y="11.5"
        width="13"
        height="16"
        rx="2.5"
        fill="#0E1422"
        stroke="#2563EB"
        strokeWidth="1.2"
      />

      {/* Document Lines */}
      <line x1="16.5" y1="15" x2="23.5" y2="15" stroke="#F8FAFC" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16.5" y1="18" x2="21.5" y2="18" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />

      {/* Verified Scheme Checkmark */}
      <path
        d="M16 22.5L18.5 25L23.5 19.5"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Saffron & Emerald Civic Indicator Dots */}
      <circle cx="20" cy="6.5" r="1.25" fill="#F59E0B" />
      <circle cx="20" cy="33.5" r="1" fill="#10B981" />

      <defs>
        <linearGradient id="civicShieldGradient" x1="20" y1="3.5" x2="20" y2="36.8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E3A8A" />
          <stop offset="0.5" stopColor="#0F172A" />
          <stop offset="1" stopColor="#090D16" />
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
      <div className="flex flex-col justify-center">
        <span className={`${textSizes[size]} font-bold tracking-tight font-heading flex items-baseline leading-none`}>
          <span className="text-[#F8FAFC] font-extrabold">GovScheme</span>
          <span className="text-[#3B82F6] font-extrabold ml-0.5">AI</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] ml-1 self-center" />
        </span>
        {variant === 'with-subtitle' && (
          <span className="text-[10px] font-medium tracking-wider text-[#94A3B8] uppercase mt-0.5">
            Verified Citizen Schemes Index
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
