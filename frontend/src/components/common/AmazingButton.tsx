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
  glow = false,
  disabled,
  onClick,
  type = 'button',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-xs sm:text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-sm sm:text-base rounded-xl gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm hover:shadow-md border border-blue-400/20 active:bg-blue-700',
    saffron:
      'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-sm hover:shadow-md border border-amber-300/30 active:bg-amber-600',
    gradient:
      'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-sm hover:shadow-md border border-white/10',
    emerald:
      'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm hover:shadow-md border border-emerald-400/20 active:bg-emerald-700',
    secondary:
      'bg-[#0E1422] hover:bg-[#162035] text-slate-200 hover:text-white border border-white/[0.08] hover:border-blue-500/30 shadow-xs',
    ghost:
      'bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white',
    outline:
      'bg-transparent border border-blue-500/30 hover:border-blue-400 text-blue-400 hover:text-white hover:bg-blue-600/10',
  };

  const baseClasses = `
    inline-flex items-center justify-center font-heading transition-all duration-200
    active:scale-[0.98] select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080C15]
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
