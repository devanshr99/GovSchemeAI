'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export interface AmazingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'gradient' | 'secondary' | 'ghost' | 'outline';
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
  glow = true,
  disabled,
  onClick,
  type = 'button',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-7 py-3.5 text-base rounded-2xl gap-2.5',
  };

  const variantClasses = {
    primary:
      'relative group overflow-hidden bg-gradient-to-b from-[#1E1B4B] to-[#0F0E26] text-white border border-[#8B5CF6]/40 hover:border-[#A855F7] shadow-lg shadow-[#8B5CF6]/15 hover:shadow-[#8B5CF6]/30',
    gradient:
      'relative group overflow-hidden bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] text-white font-bold shadow-lg shadow-[#8B5CF6]/25 hover:shadow-[#8B5CF6]/45 border border-white/20',
    secondary:
      'bg-[#0E1017] hover:bg-[#161926] text-slate-100 hover:text-white border border-white/[0.08] hover:border-purple-500/40 shadow-xs',
    ghost:
      'bg-transparent hover:bg-purple-600/15 text-purple-300 hover:text-purple-200',
    outline:
      'bg-transparent border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-white hover:bg-purple-600/15',
  };

  const baseClasses = `
    inline-flex items-center justify-center font-bold transition-all duration-300
    active:scale-[0.98] select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 focus:ring-offset-2 focus:ring-offset-[#090A0F]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const content = (
    <>
      {/* Background Sheen & Hover Glow */}
      {(variant === 'primary' || variant === 'gradient') && (
        <span
          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"
          aria-hidden="true"
        />
      )}
      {glow && (variant === 'primary' || variant === 'gradient') && (
        <span
          className="absolute -inset-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-xl opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-300 -z-10"
          aria-hidden="true"
        />
      )}

      {/* Content layout with loading spinner and icon */}
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
