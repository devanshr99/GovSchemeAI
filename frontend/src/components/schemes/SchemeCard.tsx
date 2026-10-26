'use client';

import React, { useState, useEffect, useRef } from 'react';
import { EligibleSchemeResult } from '../../types/eligibility';
import { useApp } from '../../context/AppContext';
import { formatIndianCurrency } from '../../lib/formatter';
import Link from 'next/link';
import { Modal } from '../common/Modal';
import { 
  ShieldCheck, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  ArrowRight,
  Building2,
  Coins,
  CheckCircle2,
  Scale,
  MoreVertical,
  Share2,
  Copy,
  Check,
  Bot
} from 'lucide-react';

interface SchemeCardProps {
  scheme: EligibleSchemeResult;
  isMatchedView?: boolean;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({ scheme, isMatchedView = true }) => {
  const { language } = useApp();

  // Initialize bookmark state from localStorage
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
        return Array.isArray(saved) && saved.includes(scheme.slug);
      } catch {
        return false;
      }
    }
    return false;
  });

  const [isCompared, setIsCompared] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const compareList = JSON.parse(localStorage.getItem('govscheme_compare') || '[]');
        return Array.isArray(compareList) && compareList.includes(scheme.slug);
      } catch {
        return false;
      }
    }
    return false;
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
        if (Array.isArray(saved)) setIsBookmarked(saved.includes(scheme.slug));
        const compares = JSON.parse(localStorage.getItem('govscheme_compare') || '[]');
        if (Array.isArray(compares)) setIsCompared(compares.includes(scheme.slug));
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [scheme.slug]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
      let updated: string[];
      if (saved.includes(scheme.slug)) {
        updated = saved.filter((s: string) => s !== scheme.slug);
        setIsBookmarked(false);
      } else {
        updated = [...saved, scheme.slug];
        setIsBookmarked(true);
      }
      localStorage.setItem('govscheme_bookmarks', JSON.stringify(updated));
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const compareList: string[] = JSON.parse(localStorage.getItem('govscheme_compare') || '[]');
      let updated: string[];
      if (compareList.includes(scheme.slug)) {
        updated = compareList.filter((s: string) => s !== scheme.slug);
        setIsCompared(false);
      } else {
        if (compareList.length >= 3) {
          updated = [...compareList.slice(1), scheme.slug];
        } else {
          updated = [...compareList, scheme.slug];
        }
        setIsCompared(true);
      }
      localStorage.setItem('govscheme_compare', JSON.stringify(updated));
    } catch (err) {
      console.error('Compare error:', err);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/schemes/${scheme.slug}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayName = language === 'hi' && scheme.name_hi ? scheme.name_hi : scheme.name;
  const isCentral = scheme.level === 'Central' || !scheme.level;

  return (
    <>
      <article
        className="bg-white rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative group border border-[#E5E9E3] hover:border-[#176B52]/40 transition-all shadow-xs hover:shadow-md"
        aria-labelledby={`scheme-title-${scheme.slug}`}
      >
        <div className="space-y-3.5">
          {/* Card Top Strip: Category Badge + Scheme Level + Contextual Menu */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E7F3EC] text-[#176B52] border border-[#176B52]/20">
                {scheme.category_name || 'General Welfare'}
              </span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                isCentral 
                  ? 'bg-[#FAF5E9] text-[#8C6212] border-[#F3E7CA]' 
                  : 'bg-[#F7F8F5] text-[#4F594F] border-[#E5E9E3]'
              }`}>
                {isCentral ? 'Central Scheme' : `State: ${scheme.state_name || 'State'}`}
              </span>
            </div>

            {/* Contextual Actions (Bookmark & Three-Dot Popover) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleBookmark}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isBookmarked
                    ? 'bg-[#FAF5E9] text-[#E8A126] border-[#F3E7CA]'
                    : 'text-[#8A968A] hover:text-[#202820] border-transparent hover:bg-[#F7F8F5]'
                }`}
                title={isBookmarked ? 'Remove from Saved' : 'Save Scheme'}
                aria-label={isBookmarked ? 'Remove from Saved' : 'Save Scheme'}
              >
                {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </button>

              {/* Three-Dot Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(!menuOpen);
                  }}
                  className="p-1.5 rounded-lg text-[#8A968A] hover:text-[#202820] hover:bg-[#F7F8F5] transition-colors cursor-pointer"
                  aria-label="More actions"
                  aria-expanded={menuOpen}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-2xl bg-white border border-[#E5E9E3] shadow-xl p-1.5 z-30 animate-fade-in text-left">
                    <button
                      type="button"
                      onClick={(e) => {
                        toggleCompare(e);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#202820] hover:text-[#176B52] hover:bg-[#F7F8F5] rounded-xl transition-colors cursor-pointer"
                    >
                      <Scale className="h-3.5 w-3.5 text-[#176B52]" />
                      <span>{isCompared ? 'Remove from Compare' : 'Add to Compare'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShareModalOpen(true);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#202820] hover:text-[#176B52] hover:bg-[#F7F8F5] rounded-xl transition-colors cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5 text-[#E8A126]" />
                      <span>Share Scheme</span>
                    </button>
                    <Link
                      href={`/chat?q=${encodeURIComponent(`Explain eligibility requirements and application steps for ${scheme.name}`)}`}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#202820] hover:text-[#176B52] hover:bg-[#F7F8F5] rounded-xl transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Bot className="h-3.5 w-3.5 text-[#176B52]" />
                      <span>Ask AI Advisor</span>
                    </Link>
                    {(scheme.application_url || scheme.portal_url) && (
                      <a
                        href={scheme.application_url || scheme.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#202820] hover:text-[#176B52] hover:bg-[#F7F8F5] rounded-xl transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-[#687368]" />
                        <span>Official Portal</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scheme Title */}
          <Link href={`/schemes/${scheme.slug}`} className="block group/title">
            <h3
              id={`scheme-title-${scheme.slug}`}
              className="font-heading text-base sm:text-lg font-bold text-[#202820] group-hover/title:text-[#176B52] transition-colors line-clamp-2 leading-snug"
            >
              {displayName}
            </h3>
          </Link>

          {/* Ministry / Department */}
          {scheme.ministry_name && (
            <div className="flex items-center gap-1.5 text-xs text-[#687368]">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-[#8A968A]" />
              <span className="truncate">{scheme.ministry_name}</span>
            </div>
          )}

          {/* Benefit Highlight Card */}
          <div className="p-3 rounded-xl bg-[#F7F8F5] border border-[#E5E9E3] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#E7F3EC] text-[#176B52] flex items-center justify-center shrink-0">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#687368] tracking-wider block">Estimated Benefit</span>
                <span className="text-xs sm:text-sm font-bold text-[#176B52] font-heading">
                  {scheme.benefits_amount ? formatIndianCurrency(scheme.benefits_amount) : 'Financial & Social Aid'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#687368]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#176B52]" />
              <span>Official</span>
            </div>
          </div>

          {/* Matched View Evaluation Highlights */}
          {isMatchedView && scheme.rules_evaluation && scheme.rules_evaluation.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {scheme.rules_evaluation.slice(0, 2).map((rule, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-[#4F594F]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#176B52] shrink-0" />
                  <span className="truncate">{rule.replace(/^[✓✔]\s*/, '')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="pt-4 mt-4 border-t border-[#E5E9E3] flex items-center justify-between gap-2">
          {/* Quick Compare Checkbox */}
          <button
            type="button"
            onClick={toggleCompare}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              isCompared
                ? 'bg-[#E7F3EC] text-[#176B52] border-[#176B52]/40'
                : 'text-[#687368] hover:text-[#202820] border-[#E5E9E3] hover:bg-[#F7F8F5]'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isCompared ? 'Compared' : 'Compare'}</span>
          </button>

          {/* Primary View Action */}
          <Link
            href={`/schemes/${scheme.slug}`}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#F7F8F5] hover:bg-[#176B52] text-[#202820] hover:text-white border border-[#E5E9E3] hover:border-[#176B52] transition-all cursor-pointer"
          >
            <span>View Scheme</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </article>

      {/* Share Modal Dialog */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Share Government Scheme"
        description="Share official scheme details with fellow citizens via direct link."
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#F7F8F5] border border-[#E5E9E3]">
            <div className="text-xs font-bold text-[#202820] line-clamp-1">{scheme.name}</div>
            <div className="text-[11px] text-[#687368] mt-0.5">{scheme.ministry_name || 'Government of India'}</div>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-[#687368] font-medium">Scheme Page Link</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/schemes/${scheme.slug}` : ''}
                className="w-full text-xs px-3.5 py-2 rounded-xl bg-white border border-[#E5E9E3] text-[#202820]"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-[#176B52] hover:bg-[#124C3D] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SchemeCard;
