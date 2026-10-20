'use client';

import React, { useState, useEffect } from 'react';
import { EligibleSchemeResult } from '../../types/eligibility';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { formatIndianCurrency } from '../../lib/formatter';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  ExternalLink, 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  ArrowRight,
  Building2,
  Coins,
  CheckCircle2,
  XCircle,
  Scale
} from 'lucide-react';

interface SchemeCardProps {
  scheme: EligibleSchemeResult;
  isMatchedView?: boolean;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({ scheme, isMatchedView = true }) => {
  const { language, t } = useApp();
  const router = useRouter();

  // Initialize bookmark state from localStorage safely without synchronous cascading re-render
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

  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string | undefined>(scheme.ai_explanation);

  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
        if (Array.isArray(saved)) {
          setIsBookmarked(saved.includes(scheme.slug));
        }
      } catch {
        // Ignore JSON parse errors
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [scheme.slug]);

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
          // Keep max 3 for side-by-side comparison
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

  const handleExplain = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (aiExplanation) return;
    setAiLoading(true);
    try {
      const chatData = await api.sendChatMessage({
        message: `Briefly explain why an eligible citizen should consider: "${scheme.name}". Benefits: ${scheme.benefits_amount || 'Financial and welfare assistance'}. Category: ${scheme.category_name || 'General'}. Max 2 clear sentences.`,
        language: (language === 'hi' ? 'hi' : 'en') as 'en' | 'hi',
      });
      setAiExplanation(chatData.response);
    } catch (err) {
      console.error('AI explanation error:', err);
      setAiExplanation("AI analysis temporarily offline. Check the official eligibility criteria on the scheme details page.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCardClick = () => {
    // Record into recently viewed in localStorage
    if (typeof window !== 'undefined') {
      try {
        const recent = JSON.parse(localStorage.getItem('govscheme_recently_viewed') || '[]');
        const filtered = recent.filter((r: { slug: string }) => r.slug !== scheme.slug);
        const updated = [
          {
            id: scheme.id,
            slug: scheme.slug,
            name: scheme.name,
            name_hi: scheme.name_hi,
            category_name: scheme.category_name,
            level: scheme.level,
            benefits_amount: scheme.benefits_amount,
          },
          ...filtered,
        ].slice(0, 6);
        localStorage.setItem('govscheme_recently_viewed', JSON.stringify(updated));
      } catch (err) {
        console.warn('Recently viewed storage error:', err);
      }
    }
    router.push(`/schemes/${scheme.slug}`);
  };

  const handleInnerLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const displayName = language === 'hi' && scheme.name_hi ? scheme.name_hi : scheme.name;

  return (
    <article 
      onClick={handleCardClick}
      className="gov-card scheme-card gov-card-hover p-5 sm:p-6 relative overflow-hidden group cursor-pointer flex flex-col justify-between border border-white/[0.08] hover:border-purple-500/40"
      aria-label={`Scheme: ${displayName}`}
    >
      {/* Top Subtle Radial Accent */}
      <div 
        className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-purple-600/10 via-purple-600/5 to-transparent rounded-bl-full pointer-events-none transition-opacity duration-300 opacity-60 group-hover:opacity-100" 
        aria-hidden="true" 
      />

      <div className="flex flex-col gap-4">
        {/* Badges & Actions Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            {/* Category Pill */}
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {scheme.category_name || 'General Welfare'}
            </span>

            {/* Government Level Pill */}
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {scheme.level || 'Central'}
            </span>

            {/* Verified Official Source Badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
              <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>Official</span>
            </span>
          </div>

          {/* Action Icons: Bookmark & Compare */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Compare Toggle */}
            <button
              type="button"
              onClick={toggleCompare}
              title={isCompared ? "Remove from comparison" : "Add to side-by-side comparison"}
              aria-label={isCompared ? "Remove from comparison" : "Add to comparison"}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                isCompared
                  ? 'bg-purple-600/25 border-purple-500/50 text-purple-300'
                  : 'bg-[#0E1017] border-white/[0.08] text-slate-400 hover:text-white hover:border-purple-500/30'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
            </button>

            {/* Bookmark button */}
            <button
              type="button"
              onClick={toggleBookmark}
              title={isBookmarked ? "Remove bookmark" : "Save this scheme"}
              aria-label={isBookmarked ? "Remove bookmark" : "Save this scheme"}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                isBookmarked 
                  ? 'bg-purple-600/25 border-purple-500/50 text-purple-300' 
                  : 'bg-[#0E1017] border-white/[0.08] text-slate-400 hover:text-white hover:border-purple-500/30'
              }`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-3.5 w-3.5 text-purple-400" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Match Percentage Badge */}
            {isMatchedView && scheme.match_score !== undefined && (
              <div 
                className="inline-flex flex-col items-center px-2 py-1 rounded-lg bg-[#0E1017] border border-emerald-500/30 shadow-xs"
                title={`${Math.round(scheme.match_score * 100)}% criteria match with your profile`}
              >
                <span className="text-xs font-black text-emerald-400 leading-none">
                  {Math.round(scheme.match_score * 100)}%
                </span>
                <span className="text-[7px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
                  Match
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Scheme Title & Ministry */}
        <div className="space-y-1">
          <h3 className="font-heading text-base sm:text-lg font-bold text-slate-100 leading-snug group-hover:text-purple-300 transition-colors">
            <Link 
              href={`/schemes/${scheme.slug}`} 
              onClick={handleInnerLinkClick}
              className="focus-visible:outline-none"
            >
              {displayName}
            </Link>
          </h3>

          {scheme.ministry && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5 line-clamp-1">
              <Building2 className="h-3 w-3 text-purple-400/80 shrink-0" aria-hidden="true" />
              <span>{scheme.ministry}</span>
            </p>
          )}
        </div>

        {/* Key Benefit Allocation Card */}
        {scheme.benefits_amount && (
          <div className="flex items-center gap-2.5 bg-[#0E1017] border border-white/[0.06] p-2.5 rounded-xl">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Coins className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {t('benefits')}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-1">
                {/^\d+$/.test(scheme.benefits_amount.trim()) 
                  ? formatIndianCurrency(scheme.benefits_amount.trim()) 
                  : scheme.benefits_amount}
              </span>
            </div>
          </div>
        )}

        {/* Inline AI Explanation Card */}
        {isMatchedView && aiExplanation && (
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/25 text-xs text-slate-200 leading-relaxed animate-fade-in">
            <div className="flex items-center gap-1.5 font-bold text-purple-300 mb-1 text-[11px]">
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>Citizen Advisor Insight:</span>
            </div>
            <p className="text-xs text-slate-300 italic">
              &ldquo;{aiExplanation}&rdquo;
            </p>
          </div>
        )}

        {/* Rule Evaluation Match Indicators */}
        {isMatchedView && scheme.rules_evaluation && scheme.rules_evaluation.length > 0 && (
          <div className="space-y-1.5 border-t border-white/[0.06] pt-3">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">
              Profile Validation Status:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {scheme.rules_evaluation.slice(0, 4).map((rule, rIdx) => {
                const passed = rule.startsWith('✓');
                return (
                  <div key={rIdx} className="flex items-center gap-1.5 text-xs text-slate-300">
                    {passed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="truncate text-[11px]">{rule.replace(/[✓✗]\s*/, '')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer Bar */}
      <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 mt-4 shrink-0 gap-2">
        <span className="text-xs text-purple-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
          <span>View Guidelines</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>

        <div className="flex items-center gap-2">
          {/* AI Explain Button */}
          {isMatchedView && !aiExplanation && (
            <button
              type="button"
              onClick={handleExplain}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>{aiLoading ? 'Analyzing...' : t('explainWhy')}</span>
            </button>
          )}

          {/* Official Apply Now Link */}
          {scheme.application_url && (
            <a
              href={scheme.application_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleInnerLinkClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer focus-visible:outline-none"
              title="Opens official government portal (.gov.in)"
            >
              <span>{t('applyNow')}</span>
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

export default SchemeCard;
