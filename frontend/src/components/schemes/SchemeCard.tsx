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
        className="gov-card gov-card-hover rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative group border border-white/[0.08] transition-all bg-[#111827]"
        aria-labelledby={`scheme-title-${scheme.slug}`}
      >
        <div className="space-y-3.5">
          {/* Card Top Strip: Category Badge + Scheme Level + Contextual Menu */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {scheme.category_name || 'General Welfare'}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                isCentral 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
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
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'text-slate-400 hover:text-white border-transparent hover:bg-white/[0.05]'
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
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                  aria-label="More actions"
                  aria-expanded={menuOpen}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-xl bg-[#0E1422] border border-white/[0.1] shadow-xl p-1 z-30 animate-fade-in text-left">
                    <button
                      type="button"
                      onClick={(e) => {
                        toggleCompare(e);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                    >
                      <Scale className="h-3.5 w-3.5 text-blue-400" />
                      <span>{isCompared ? 'Remove from Compare' : 'Add to Compare'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShareModalOpen(true);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                    >
                      <Share2 className="h-3.5 w-3.5 text-amber-400" />
                      <span>Share Scheme</span>
                    </button>
                    <Link
                      href={`/chat?q=${encodeURIComponent(`Explain eligibility requirements and application steps for ${scheme.name}`)}`}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Bot className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Ask AI Advisor</span>
                    </Link>
                    {(scheme.application_url || scheme.portal_url) && (
                      <a
                        href={scheme.application_url || scheme.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
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
              className="font-heading text-base sm:text-lg font-bold text-slate-100 group-hover/title:text-blue-400 transition-colors line-clamp-2 leading-snug"
            >
              {displayName}
            </h3>
          </Link>

          {/* Ministry / Department */}
          {scheme.ministry_name && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span className="truncate">{scheme.ministry_name}</span>
            </div>
          )}

          {/* Benefit Highlight Card */}
          <div className="p-3 rounded-xl bg-[#0E1422] border border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Estimated Benefit</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-400 font-heading">
                  {scheme.benefits_amount ? formatIndianCurrency(scheme.benefits_amount) : 'Financial & Social Aid'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Official</span>
            </div>
          </div>

          {/* Matched View Evaluation Highlights */}
          {isMatchedView && scheme.rules_evaluation && scheme.rules_evaluation.length > 0 && (
            <div className="space-y-1 pt-1">
              {scheme.rules_evaluation.slice(0, 2).map((rule, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{rule.replace(/^[✓✔]\s*/, '')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
          {/* Quick Compare Checkbox */}
          <button
            type="button"
            onClick={toggleCompare}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              isCompared
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 border-white/[0.06] hover:bg-white/[0.04]'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isCompared ? 'Compared' : 'Compare'}</span>
          </button>

          {/* Primary View Action */}
          <Link
            href={`/schemes/${scheme.slug}`}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white/[0.06] hover:bg-blue-600 text-slate-200 hover:text-white border border-white/[0.08] hover:border-blue-500 transition-all cursor-pointer"
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
          <div className="p-3 rounded-xl bg-[#080C15] border border-white/[0.08]">
            <div className="text-xs font-bold text-slate-200 line-clamp-1">{scheme.name}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{scheme.ministry_name || 'Government of India'}</div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] text-slate-400 font-medium">Scheme Page Link</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/schemes/${scheme.slug}` : ''}
                className="w-full text-xs px-3 py-2 rounded-lg bg-[#080C15] border border-white/[0.1] text-slate-300"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
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
