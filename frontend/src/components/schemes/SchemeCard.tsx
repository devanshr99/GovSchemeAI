'use client';

import React, { useState, useEffect } from 'react';
import { EligibleSchemeResult } from '../../types/eligibility';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { formatIndianCurrency } from '../../lib/formatter';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Globe, Sparkles, Bookmark, BookmarkCheck, ArrowRight } from 'lucide-react';

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
      setAiExplanation("AI explanation is currently offline. Review the scheme rules and official criteria on the detail page.");
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
      className="gov-card gov-card-hover p-5 sm:p-6 relative overflow-hidden group cursor-pointer flex flex-col justify-between"
    >
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-[#8B5CF6]/10 to-transparent rounded-bl-full pointer-events-none transition-opacity opacity-60 group-hover:opacity-100" />

      <div className="flex flex-col gap-4">
        {/* Header Badges & Title */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#8B5CF6]/15 text-[#A855F7] border border-[#8B5CF6]/30">
                {scheme.category_name || 'General Welfare'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
                {scheme.level || 'Central'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/20">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#F5F5F7] leading-snug group-hover:text-[#A855F7] transition-colors">
              <Link href={`/schemes/${scheme.slug}`} onClick={handleInnerLinkClick}>
                {displayName}
              </Link>
            </h3>

            {scheme.ministry && (
              <p className="text-xs text-[#A1A1AA] line-clamp-1">{scheme.ministry}</p>
            )}
          </div>

          <div className="flex items-start gap-2 shrink-0">
            {/* Bookmark button */}
            <button
              onClick={toggleBookmark}
              aria-label="Bookmark scheme"
              className="p-2 rounded-lg bg-[#0D0F14] border border-[#242832] hover:border-[#8B5CF6]/40 text-[#A1A1AA] hover:text-white transition-all cursor-pointer"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-[#A855F7]" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>

            {/* Match Percentage Badge */}
            {isMatchedView && scheme.match_score !== undefined && (
              <div className="text-right">
                <div className="inline-flex flex-col items-center px-2.5 py-1.5 rounded-xl bg-[#0D0F14] border border-[#8B5CF6]/30">
                  <span className="text-sm font-extrabold text-[#22C55E]">
                    {Math.round(scheme.match_score * 100)}%
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-[#71717A] font-bold">
                    Match
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Benefits Box */}
        {scheme.benefits_amount && (
          <div className="flex items-center gap-2 bg-[#0D0F14] border border-[#242832] p-3 rounded-xl">
            <span className="text-xs font-semibold text-[#A1A1AA]">{t('benefits')}:</span>
            <span className="text-xs sm:text-sm font-bold text-[#F5F5F7]">
              {/^\d+$/.test(scheme.benefits_amount.trim()) 
                ? formatIndianCurrency(scheme.benefits_amount.trim()) 
                : scheme.benefits_amount}
            </span>
          </div>
        )}

        {/* Inline AI Explanation */}
        {isMatchedView && aiExplanation && (
          <div className="p-3 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-xs text-[#F5F5F7] leading-relaxed animate-fade-in">
            <span className="font-bold text-[#A855F7] block mb-1">Advisor Analysis:</span>
            "{aiExplanation}"
          </div>
        )}

        {/* Rules Evaluation Checklist */}
        {isMatchedView && scheme.rules_evaluation && scheme.rules_evaluation.length > 0 && (
          <div className="space-y-1.5 border-t border-[#242832] pt-3">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#71717A] block">Eligibility Match Status:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {scheme.rules_evaluation.slice(0, 4).map((rule, rIdx) => {
                const passed = rule.startsWith('✓');
                return (
                  <div key={rIdx} className="flex items-center gap-1.5 text-xs text-[#A1A1AA]">
                    <span className={passed ? "text-[#22C55E] font-bold" : "text-rose-400 font-bold"}>
                      {passed ? "✓" : "✗"}
                    </span>
                    <span className="truncate">{rule.replace(/[✓✗]\s*/, '')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer Bar */}
      <div className="flex items-center justify-between border-t border-[#242832] pt-3.5 mt-4 shrink-0">
        <span className="text-xs text-[#A855F7] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
          <span>View Scheme Details</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </span>

        <div className="flex items-center gap-2">
          {isMatchedView && !aiExplanation && (
            <button
              onClick={handleExplain}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A855F7] hover:bg-[#8B5CF6]/20 transition-all cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <Globe className="h-3.5 w-3.5" />
              {t('applyNow')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemeCard;
