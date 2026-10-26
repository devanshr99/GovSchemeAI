'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
  divider?: boolean;
}

interface DropdownMenuProps {
  label: string;
  icon?: React.ReactNode;
  items: DropdownItem[];
  className?: string;
  align?: 'left' | 'right';
  badge?: number | string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  label,
  icon,
  items,
  className = '',
  align = 'left',
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
          isOpen
            ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
            : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {icon && <span className="text-slate-400">{icon}</span>}
        <span>{label}</span>
        {badge !== undefined && (
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-600 text-white">
            {badge}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 text-slate-400 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-64 origin-top-right rounded-xl bg-[#0E1422] border border-white/[0.1] shadow-2xl shadow-black/80 backdrop-blur-xl focus:outline-none z-50 p-1.5 animate-fade-in`}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return <div key={idx} className="my-1.5 border-t border-white/[0.06]" />;
            }

            const itemContent = (
              <div className="flex items-start gap-2.5 w-full">
                {item.icon && <span className="shrink-0 text-blue-400 mt-0.5">{item.icon}</span>}
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );

            if (item.href) {
              return (
                <a
                  key={idx}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="group flex w-full items-center px-2.5 py-2 rounded-lg text-xs hover:bg-white/[0.06] transition-colors"
                  role="menuitem"
                >
                  {itemContent}
                </a>
              );
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                className="group flex w-full items-center px-2.5 py-2 rounded-lg text-xs hover:bg-white/[0.06] transition-colors cursor-pointer"
                role="menuitem"
              >
                {itemContent}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
