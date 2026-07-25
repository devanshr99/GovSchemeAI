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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] text-xs font-semibold bg-white hover:bg-[#F9FAFB] text-[#374151] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 focus-visible:outline-none"
      >
        <Globe className="h-3.5 w-3.5 text-[#0F766E]" />
        <span>{LANGUAGE_NAMES[language]?.nativeName || "English"}</span>
      </button>

      {/* Dropdown Options List */}
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby="language-picker-button"
          tabIndex={-1}
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-[#E5E7EB] bg-white shadow-lg focus:outline-none py-1.5 z-[100] max-h-80 overflow-y-auto"
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
                    ? 'text-[#9CA3AF] cursor-not-allowed bg-transparent'
                    : isSelected
                    ? 'bg-[#F0FDFA] text-[#0F766E] font-semibold'
                    : isFocused
                    ? 'bg-[#F3F4F6] text-[#111827]'
                    : 'text-[#374151] hover:bg-[#F9FAFB]'
                }`}
              >
                <div className="flex flex-col">
                  <span>{langInfo.nativeName}</span>
                  <span className="text-[10px] text-[#9CA3AF]">{langInfo.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#0F766E]" aria-hidden="true" />}
                  {!isActive && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#FFFBEB] text-[#B45309] border border-[#F59E0B]/20">
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
