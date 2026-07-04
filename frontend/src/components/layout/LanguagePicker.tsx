import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGE_NAMES, Language } from '../../lib/translations';

export const LanguagePicker: React.FC = () => {
  const { language, setLanguage, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const languages = Object.entries(LANGUAGE_NAMES) as Array<[Language, typeof LANGUAGE_NAMES.en]>;

  // Toggle list visibility
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setActiveIndex(-1);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation inside dropdown list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % languages.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + languages.length) % languages.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0) {
          const [langKey, langInfo] = languages[activeIndex];
          if (langInfo.isActive) {
            setLanguage(langKey);
            setIsOpen(false);
            triggerRef.current?.focus();
          }
        }
        break;
      case 'Tab':
        // Close on blur
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Focus active item when activeIndex changes
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('li[role="option"]');
      const activeItem = items[activeIndex] as HTMLElement;
      activeItem?.focus();
    }
  }, [activeIndex, isOpen]);

  return (
    <div className="relative inline-block text-left" ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id="language-picker-button"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('langPickerLabel')}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/20 text-xs font-semibold bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        <Globe className="h-3.5 w-3.5 text-blue-400" />
        <span>{LANGUAGE_NAMES[language]?.nativeName || "English"}</span>
      </button>

      {/* Dropdown Options List */}
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby="language-picker-button"
          tabIndex={-1}
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-white/[0.08] bg-[#0f172a]/95 shadow-2xl backdrop-blur-md focus:outline-none py-1.5 z-[100] max-h-80 overflow-y-auto"
        >
          {languages.map(([langKey, langInfo], index) => {
            const isSelected = language === langKey;
            const isActive = langInfo.isActive;
            const isFocused = index === activeIndex;

            return (
              <li
                key={langKey}
                role="option"
                aria-selected={isSelected}
                tabIndex={isFocused ? 0 : -1}
                aria-disabled={!isActive}
                onClick={() => {
                  if (isActive) {
                    setLanguage(langKey);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex items-center justify-between px-4 py-2 text-xs font-medium cursor-pointer transition-colors focus:outline-none ${
                  !isActive 
                    ? 'text-slate-500 cursor-not-allowed bg-transparent'
                    : isSelected
                    ? 'bg-blue-600/20 text-blue-400 font-semibold'
                    : isFocused
                    ? 'bg-white/[0.04] text-slate-200'
                    : 'text-slate-300 hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex flex-col">
                  <span>{langInfo.nativeName}</span>
                  <span className="text-[10px] text-slate-500">{langInfo.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isSelected && <Check className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />}
                  {!isActive && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      <AlertCircle className="h-2 w-2" />
                      {t('comingSoon')}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
export default LanguagePicker;
