'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/35 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          className={`w-screen ${widthClasses[width]} bg-white border-l border-[#E5E9E3] shadow-2xl flex flex-col justify-between animate-slide-in-right`}
        >
          {/* Header */}
          <div className="p-5 border-b border-[#E5E9E3] flex items-center justify-between bg-[#F7F8F5]">
            <div>
              <h2 className="font-heading text-base font-bold text-[#202820]">{title}</h2>
              {subtitle && <p className="text-xs text-[#687368] mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#687368] hover:text-[#202820] hover:bg-white transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 flex-1 overflow-y-auto text-[#202820] bg-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideOver;
