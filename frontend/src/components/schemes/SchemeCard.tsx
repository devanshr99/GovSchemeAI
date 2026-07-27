'use client';

import React, { useState, useEffect } from 'react';
import { EligibleSchemeResult } from '../../types/eligibility';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { formatIndianCurrency, formatIndianDate } from '../../lib/formatter';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Calendar, Phone, Globe, Sparkles, Award, Bookmark, BookmarkCheck, ArrowRight } from 'lucide-react';

interface SchemeCardProps {
  scheme: EligibleSchemeResult;
  isMatchedView?: boolean;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({ scheme, isMatchedView = true }) => {
  const { language, t } = useApp();
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string | undefined>(scheme.ai_explanation);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
      setIsBookmarked(saved.includes(scheme.slug));
    }
  }, [scheme.slug]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
    let updated;
    if (saved.includes(scheme.slug)) {
      updated = saved.filter((s: string) => s !== scheme.slug);
      setIsBookmarked(false);
    } else {
      updated = [...saved, scheme.slug];
      setIsBookmarked(true);
    }
    localStorage.setItem('govscheme_bookmarks', JSON.stringify(updated));
  };

  const handleExplain = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (aiExplanation) return;
    setAiLoading(true);
    try {
      const chatData = await api.sendChatMessage({
        message: `Briefly explain why someone might be eligible for the government scheme: "${scheme.name}". Benefits: ${scheme.benefits_amount || scheme.benefits || 'Various benefits'}. Category: ${scheme.category_name || 'General'}. Keep it to 2-3 sentences.`,
        language: (language === 'hi' ? 'hi' : 'en') as 'en' | 'hi',
      });
      setAiExplanation(chatData.response);
    } catch (err) {
      console.error('AI explain error:', err);
      setAiExplanation("AI explanation is unavailable. Please review the eligibility criteria and documents listed on the detail page.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/schemes/${scheme.slug}`);
  };

  const handleInnerLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const displayName = language === 'hi' && scheme.name_hi ? scheme.name_hi : scheme.name;

  return (
    <div 
      onClick={handleCardClick}
      className="block glass-panel rounded-2xl p-5 sm:p-6 transition-all duration-300 relative overflow-hidden border-white/[0.06] hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 group cursor-pointer"
    >
      {/* Category Icon indicator */}
      <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />

      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {scheme.category_name || 'General'}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {scheme.level || 'Central'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-snug group-hover:text-blue-400 transition-colors">
              <Link href={`/schemes/${scheme.slug}`} onClick={handleInnerLinkClick}>
                {displayName}
              </Link>
            </h3>
            {scheme.ministry && (
              <p className="text-xs text-slate-400">{scheme.ministry}</p>
            )}
          </div>

          <div className="flex items-start gap-2 shrink-0">
            {/* Bookmark button */}
            <button
              onClick={toggleBookmark}
              aria-label="Bookmark scheme"
              className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:border-white/20 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-blue-400" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>

            {/* Match Score Badge */}
            {isMatchedView && (
              <div className="text-right">
                <div className="inline-flex flex-col items-center p-2 rounded-xl bg-slate-800/80 border border-white/[0.06]">
                  <span className="text-base font-extrabold text-emerald-400">
                    {Math.round(scheme.match_score * 100)}%
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">
                    Match
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Benefits Highlight */}
        {scheme.benefits_amount && (
          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
            <span className="text-xs font-semibold text-slate-400">{t('benefits')}:</span>
            <span className="text-xs sm:text-sm font-bold text-orange-400">
              {/^\d+$/.test(scheme.benefits_amount.trim()) 
                ? formatIndianCurrency(scheme.benefits_amount.trim()) 
                : scheme.benefits_amount}
            </span>
          </div>
        )}

        {/* Inline AI Explanation if available */}
        {isMatchedView && aiExplanation && (
          <div className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/10 text-xs text-slate-300 leading-relaxed italic animate-fade-in">
            <span className="font-bold text-orange-400 block mb-1">AI Match Analysis:</span>
            "{aiExplanation}"
          </div>
        )}

        {/* Rules Checklist for Eligibility View */}
        {isMatchedView && scheme.rules_evaluation && scheme.rules_evaluation.length > 0 && (
          <div className="space-y-1.5 border-t border-white/[0.04] pt-3">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Match Checklist:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {scheme.rules_evaluation.slice(0, 4).map((rule, rIdx) => {
                const passed = rule.startsWith('✓');
                return (
                  <div key={rIdx} className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className={passed ? "text-emerald-400" : "text-red-400"}>
                      {passed ? "✓" : "✗"}
                    </span>
                    <span className="truncate">{rule.replace(/[✓✗]\s*/, '')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 mt-1 shrink-0">
          <span className="text-xs text-blue-400 font-bold group-hover:underline flex items-center gap-1">
            <span>Details & Eligibility</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </span>

          <div className="flex gap-2">
            {isMatchedView && !aiExplanation && (
              <button
                onClick={handleExplain}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-500/20 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                {aiLoading ? 'Analyzing...' : t('explainWhy')}
              </button>
            )}

            {scheme.application_url && (
              <a
                href={scheme.application_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleInnerLinkClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                <Globe className="h-3.5 w-3.5" />
                {t('applyNow')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SchemeCard;
