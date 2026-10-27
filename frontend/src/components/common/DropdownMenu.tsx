'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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
  isActive?: boolean;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  label,
  icon,
  items,
  className = '',
  align = 'left',
  badge,
  isActive = false,
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
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
          isOpen || isActive
            ? 'bg-[#E7F3EC] text-[#176B52]'
            : 'text-[#202820] hover:text-[#176B52] hover:bg-[#F7F8F5]'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {icon && <span className="text-[#687368] shrink-0">{icon}</span>}
        <span>{label}</span>
        {badge !== undefined && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#176B52] text-white">
            {badge}
          </span>
        )}
        <ChevronDown 
          className={`h-3.5 w-3.5 transition-transform duration-200 text-[#687368] ${
            isOpen ? 'rotate-180 text-[#176B52]' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-72 sm:w-80 origin-top-left rounded-2xl bg-white border border-[#E5E9E3] shadow-xl shadow-black/5 focus:outline-none z-50 p-2 animate-fade-in`}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return <div key={idx} className="my-1.5 border-t border-[#E5E9E3]" />;
            }

            const itemContent = (
              <div className="flex items-start gap-3 w-full">
                {item.icon && <span className="shrink-0 text-[#176B52] mt-0.5">{item.icon}</span>}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#202820] group-hover:text-[#176B52] transition-colors truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E7F3EC] text-[#176B52] border border-[#176B52]/20">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-[#687368] line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );

            if (item.href) {
              return (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="group flex w-full items-center px-3 py-2 rounded-xl text-xs hover:bg-[#F7F8F5] transition-colors"
                  role="menuitem"
                >
                  {itemContent}
                </Link>
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
                className="group flex w-full items-center px-3 py-2 rounded-xl text-xs hover:bg-[#F7F8F5] transition-colors cursor-pointer"
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
