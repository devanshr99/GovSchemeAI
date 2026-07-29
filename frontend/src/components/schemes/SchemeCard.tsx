'use client';

import React, { useState, useEffect } from 'react';
import { EligibleSchemeResult } from '../../types/eligibility';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { formatIndianCurrency } from '../../lib/formatter';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Calendar, Globe, Bookmark, BookmarkCheck, ArrowRight, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

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
      console.error('Criteria evaluation error:', err);
      setAiExplanation("Rule evaluation summary unavailable. Please review the official eligibility checklist on the detail page.");
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
      className="gov-card gov-card-hover rounded-2xl p-5 sm:p-6 transition-all duration-200 relative overflow-hidden group cursor-pointer flex flex-col justify-between bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-400"
    >
      {/* Top Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-amber-500" />

      <div className="space-y-4">
        {/* Header Badges & Bookmark */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {scheme.category_name || 'General Sector'}
            </span>
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {scheme.level === 'state' ? ((scheme as any).state || scheme.state_code || 'State Govt') : 'Central Govt'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Bookmark button */}
            <button
              onClick={toggleBookmark}
              aria-label="Bookmark scheme"
              title={isBookmarked ? "Remove Bookmark" : "Save Scheme"}
              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-400 text-slate-500 hover:text-blue-700 transition-all cursor-pointer"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-blue-600" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>

            {/* Match Score Badge */}
            {isMatchedView && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="text-xs font-black">{Math.round(scheme.match_score * 100)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Scheme Name & Ministry */}
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
            <Link href={`/schemes/${scheme.slug}`} onClick={handleInnerLinkClick}>
              {displayName}
            </Link>
          </h3>
          {scheme.ministry && (
            <p className="text-xs text-slate-500 font-medium leading-normal">{scheme.ministry}</p>
          )}
        </div>

        {/* Benefits Amount Highlight */}
        {scheme.benefits_amount && (
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-xs font-semibold text-slate-600">{t('benefits')}:</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-700">
              {/^\d+$/.test(scheme.benefits_amount.trim()) 
                ? formatIndianCurrency(scheme.benefits_amount.trim()) 
                : scheme.benefits_amount}
            </span>
          </div>
        )}

        {/* Evaluation Summary */}
        {isMatchedView && aiExplanation && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700 leading-relaxed italic animate-fade-in">
            <span className="font-bold text-blue-800 block mb-1">Criteria Analysis:</span>
            "{aiExplanation}"
          </div>
        )}

        {/* Rules Checklist */}
        {isMatchedView && scheme.rules_evaluation && scheme.rules_evaluation.length > 0 && (
          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block">
              Evaluated Qualifications:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {scheme.rules_evaluation.slice(0, 4).map((rule, rIdx) => {
                const passed = rule.startsWith('✓');
                return (
                  <div key={rIdx} className="flex items-center gap-1.5 text-xs text-slate-700">
                    {passed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    )}
                    <span className="truncate">{rule.replace(/[✓✗]\s*/, '')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-4 shrink-0">
        <span className="text-xs text-blue-600 font-bold group-hover:underline flex items-center gap-1">
          <span>View Details & Checklist</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>

        <div className="flex items-center gap-2">
          {isMatchedView && !aiExplanation && (
            <button
              onClick={handleExplain}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              {aiLoading ? 'Evaluating...' : t('explainWhy')}
            </button>
          )}

          {scheme.application_url && (
            <a
              href={scheme.application_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleInnerLinkClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
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


