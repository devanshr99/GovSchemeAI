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
      {/* Premium Minimal White Government Shield & Document Emblem */}
      <path
        d="M18 3.5L7 8V17C7 24.5 11.6 31.2 18 33.5C24.4 31.2 29 24.5 29 17V8L18 3.5Z"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Subtle Ashoka Chakra Geometry (Indian Identity Motif) */}
      <circle cx="18" cy="12.5" r="3.2" stroke="#FFFFFF" strokeWidth="1.4" fill="none" opacity="0.9" />
      <circle cx="18" cy="12.5" r="0.9" fill="#FFFFFF" />
      {/* Integrated Minimal Checkmark (Citizen Welfare & Scheme Approval) */}
      <path
        d="M11.5 20.5L15.5 24.5L24.5 15.5"
        stroke="#FFFFFF"
        strokeWidth="2.6"
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
        <span className="text-white">GovScheme</span>
        <span className="text-[#38BDF8] ml-0.5 font-extrabold">AI</span>
      </span>
    </div>
  );
};

export default Logo;
