'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export interface AmazingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'saffron' | 'gradient' | 'secondary' | 'ghost' | 'outline' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  className?: string;
  glow?: boolean;
}

export const AmazingButton: React.FC<AmazingButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  href,
  icon,
  iconPosition = 'right',
  loading = false,
  className = '',
  disabled,
  onClick,
  type = 'button',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4.5 py-2.5 text-xs sm:text-sm rounded-xl gap-2 font-medium',
    lg: 'px-6 py-3 text-sm sm:text-base rounded-xl gap-2.5 font-medium',
  };

  const variantClasses = {
    primary:
      'bg-[#176B52] hover:bg-[#124C3D] text-white font-semibold shadow-xs hover:shadow-sm border border-[#176B52]/30 active:bg-[#0E3E31]',
    saffron:
      'bg-[#E8A126] hover:bg-[#D38E16] text-[#202820] font-semibold shadow-xs hover:shadow-sm border border-[#E8A126]/30 active:bg-[#B87A0E]',
    gradient:
      'bg-gradient-to-r from-[#176B52] to-[#1F8766] hover:from-[#124C3D] hover:to-[#176B52] text-white font-semibold shadow-xs hover:shadow-sm',
    emerald:
      'bg-[#176B52] hover:bg-[#124C3D] text-white font-semibold shadow-xs hover:shadow-sm',
    secondary:
      'bg-white hover:bg-[#F7F8F5] text-[#202820] hover:text-[#176B52] border border-[#E5E9E3] hover:border-[#176B52]/30 shadow-xs active:bg-[#EEF1EB]',
    ghost:
      'bg-transparent hover:bg-[#E7F3EC]/70 text-[#202820] hover:text-[#176B52]',
    outline:
      'bg-white border border-[#176B52]/40 hover:border-[#176B52] text-[#176B52] hover:bg-[#E7F3EC]/50 active:bg-[#E7F3EC]',
  };

  const baseClasses = `
    inline-flex items-center justify-center font-heading transition-all duration-150
    active:scale-[0.98] select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B52]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const content = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0 transition-transform group-hover:-translate-x-0.5">{icon}</span>}
          <span className="relative z-10 flex items-center gap-1.5">{children}</span>
          {icon && iconPosition === 'right' && <span className="shrink-0 transition-transform group-hover:translate-x-0.5">{icon}</span>}
        </>
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={baseClasses} aria-busy={loading}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={baseClasses}
      aria-busy={loading}
      {...props}
    >
      {content}
    </button>
  );
};

export default AmazingButton;
