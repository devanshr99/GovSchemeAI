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
      {/* Outer Shield & Government Emblem Frame */}
      <path
        d="M20 3.5L7 9.2V18.5C7 26.8 12.4 34 20 36.8C27.6 34 33 26.8 33 18.5V9.2L20 3.5Z"
        fill="url(#govPurpleGradient)"
        stroke="#A855F7"
        strokeWidth="1.5"
      />
      
      {/* Document Sheet Card */}
      <rect
        x="13.5"
        y="11.5"
        width="13"
        height="16"
        rx="2"
        fill="#08090D"
        stroke="#8B5CF6"
        strokeWidth="1.2"
      />

      {/* Document Header Line */}
      <line x1="16.5" y1="15" x2="23.5" y2="15" stroke="#F5F5F7" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16.5" y1="18" x2="21.5" y2="18" stroke="#A1A1AA" strokeWidth="1.2" strokeLinecap="round" />

      {/* Verified Scheme Checkmark */}
      <path
        d="M16 22.5L18.5 25L23.5 19.5"
        stroke="#22C55E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Subtle Saffron/Green Top & Bottom Accents for Official India Gov identity */}
      <circle cx="20" cy="6" r="1.2" fill="#F97316" />

      <defs>
        <linearGradient id="govPurpleGradient" x1="20" y1="3.5" x2="20" y2="36.8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2E1065" />
          <stop offset="0.6" stopColor="#1E1B4B" />
          <stop offset="1" stopColor="#0F172A" />
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
        <span className={`${textSizes[size]} font-bold tracking-tight font-sans flex items-baseline leading-none`}>
          <span className="text-[#F5F5F7] font-extrabold">GovScheme</span>
          <span className="text-[#A855F7] font-extrabold ml-0.5">AI</span>
        </span>
        {variant === 'with-subtitle' && (
          <span className="text-[10px] font-medium tracking-wider text-[#71717A] uppercase mt-0.5">
            Government Scheme Discovery Platform
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
