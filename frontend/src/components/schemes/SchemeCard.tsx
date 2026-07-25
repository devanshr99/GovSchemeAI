'use client';

import React, { useState, useEffect } from 'react';
import { EligibleSchemeResult } from '../../types/eligibility';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { formatIndianCurrency } from '../../lib/formatter';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe, Sparkles, Bookmark, BookmarkCheck, ArrowRight } from 'lucide-react';

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
      className="block glass-panel rounded-2xl p-6 transition-all duration-200 relative overflow-hidden hover:border-[#2563EB]/30 hover:shadow-md hover:-translate-y-0.5 group cursor-pointer"
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase font-semibold tracking-wider px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/15">
                {scheme.category_name || 'General'}
              </span>
              <span className="text-[11px] uppercase font-semibold tracking-wider px-2.5 py-0.5 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/15">
                {scheme.level || 'Central'}
              </span>
            </div>
            <h3 className="text-lg sm:text-[20px] font-semibold text-[#101828] leading-snug group-hover:text-[#2563EB] transition-colors">
              <Link href={`/schemes/${scheme.slug}`} onClick={handleInnerLinkClick}>
                {displayName}
              </Link>
            </h3>
            {scheme.ministry && (
              <p className="text-xs text-[#667085]">{scheme.ministry}</p>
            )}
          </div>

          <div className="flex items-start gap-2 shrink-0">
            {/* Bookmark button */}
            <button
              onClick={toggleBookmark}
              aria-label="Bookmark scheme"
              className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] hover:border-[#D0D5DD] text-[#667085] hover:text-[#101828] transition-all cursor-pointer"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-[#2563EB]" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>

            {/* Match Score Badge */}
            {isMatchedView && (
              <div className="text-right">
                <div className="inline-flex flex-col items-center px-3 py-1.5 rounded-xl bg-[#F0FDFA] border border-[#0F766E]/15">
                  <span className="text-base font-bold text-[#0F766E]">
                    {Math.round(scheme.match_score * 100)}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-[#667085] font-semibold">
                    Match
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Benefits Highlight */}
        {scheme.benefits_amount && (
          <div className="flex items-center gap-2.5 bg-[#FFFBEB] border border-[#F59E0B]/20 px-4 py-3 rounded-xl">
            <span className="text-xs font-medium text-[#667085]">{t('benefits')}:</span>
            <span className="text-sm font-semibold text-[#B45309]">
              {/^\d+$/.test(scheme.benefits_amount.trim()) 
                ? formatIndianCurrency(scheme.benefits_amount.trim()) 
                : scheme.benefits_amount}
            </span>
          </div>
        )}

        {/* Inline AI Explanation */}
        {isMatchedView && aiExplanation && (
          <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/15 text-xs text-[#344054] leading-relaxed italic animate-fade-in">
            <span className="font-semibold text-[#2563EB] block mb-1">AI Qualification Analysis:</span>
            &ldquo;{aiExplanation}&rdquo;
          </div>
        )}

        {/* Rules Checklist */}
        {isMatchedView && scheme.rules_evaluation && scheme.rules_evaluation.length > 0 && (
          <div className="space-y-1.5 border-t border-[#E4E7EC] pt-3.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#667085] block">Match Checklist:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scheme.rules_evaluation.slice(0, 4).map((rule, rIdx) => {
                const passed = rule.startsWith('✓');
                return (
                  <div key={rIdx} className="flex items-center gap-2 text-xs text-[#344054]">
                    <span className={passed ? "text-[#12B76A] font-bold" : "text-[#F04438] font-bold"}>
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
        <div className="flex items-center justify-between border-t border-[#E4E7EC] pt-4 mt-1 shrink-0">
          <span className="text-xs text-[#2563EB] font-semibold group-hover:underline flex items-center gap-1">
            <span>Details & Eligibility</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>

          <div className="flex gap-2">
            {isMatchedView && !aiExplanation && (
              <button
                onClick={handleExplain}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#F59E0B]/20 bg-[#FFFBEB] text-[#B45309] hover:bg-[#FEF3C7] transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {aiLoading ? 'Analyzing...' : t('explainWhy')}
              </button>
            )}

            {scheme.application_url && (
              <a
                href={scheme.application_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleInnerLinkClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
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
