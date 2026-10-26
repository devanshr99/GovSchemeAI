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
        fill="#E7F3EC"
        stroke="#176B52"
        strokeWidth="1.75"
      />
      
      {/* Document Sheet Card */}
      <rect
        x="13.5"
        y="11.5"
        width="13"
        height="16"
        rx="2.5"
        fill="#FFFFFF"
        stroke="#176B52"
        strokeWidth="1.2"
      />

      {/* Document Lines */}
      <line x1="16.5" y1="15" x2="23.5" y2="15" stroke="#202820" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16.5" y1="18" x2="21.5" y2="18" stroke="#687368" strokeWidth="1.2" strokeLinecap="round" />

      {/* Verified Scheme Checkmark */}
      <path
        d="M16 22.5L18.5 25L23.5 19.5"
        stroke="#176B52"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Saffron & Forest Green Civic Indicator Dots */}
      <circle cx="20" cy="6.5" r="1.3" fill="#E8A126" />
      <circle cx="20" cy="33.5" r="1.2" fill="#176B52" />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{Symbol}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {Symbol}
      <div className="flex flex-col justify-center">
        <span className={`${textSizes[size]} font-extrabold tracking-tight font-heading flex items-baseline leading-none`}>
          <span className="text-[#202820]">GovScheme</span>
          <span className="text-[#176B52] ml-0.5">AI</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8A126] ml-1 self-center" />
        </span>
        {variant === 'with-subtitle' && (
          <span className="text-[10px] font-semibold tracking-wider text-[#687368] uppercase mt-0.5">
            National Citizen Schemes Portal
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
