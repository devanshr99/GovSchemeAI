'use client';

import React, { useState } from 'react';
import { EligibleSchemeResult } from '../../types/eligibility';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { formatIndianCurrency, formatIndianDate } from '../../lib/formatter';
import Link from 'next/link';
import { ShieldCheck, Calendar, Phone, Globe, ChevronDown, ChevronUp, Sparkles, Award } from 'lucide-react';

interface SchemeCardProps {
  scheme: EligibleSchemeResult;
  isMatchedView?: boolean;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({ scheme, isMatchedView = true }) => {
  const { language, t } = useApp();
  const [expanded, setExpanded] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string | undefined>(scheme.ai_explanation);

  const displayName = language === 'hi' && scheme.name_hi ? scheme.name_hi : scheme.name;
  const displayBenefits = language === 'hi' && scheme.benefits_hi ? scheme.benefits_hi : scheme.benefits;

  const handleExplain = async (e: React.MouseEvent) => {
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
      setAiExplanation("AI explanation is unavailable. Please review the eligibility criteria and documents listed below.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div 
      className={`glass-panel rounded-2xl p-5 sm:p-6 transition-all duration-300 relative overflow-hidden ${
        expanded ? 'border-blue-500/30 shadow-lg shadow-blue-500/5' : 'hover:border-white/10 hover:translate-y-[-2px]'
      }`}
    >
      {/* Category Icon indicator */}
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />

      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {scheme.category_name || 'General'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {scheme.level || 'Central'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 leading-snug">{displayName}</h3>
            {scheme.ministry && (
              <p className="text-xs text-slate-400">{scheme.ministry}</p>
            )}
          </div>

          {/* Match Score Badge */}
          {isMatchedView && (
            <div className="text-right">
              <div className="inline-flex flex-col items-center p-2 rounded-xl bg-slate-800/80 border border-white/[0.06]">
                <span className="text-lg font-extrabold text-emerald-400">
                  {Math.round(scheme.match_score * 100)}%
                </span>
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">
                  {t('matchScore')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Amount Highlight */}
        {scheme.benefits_amount && (
          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
            <span className="text-xs font-semibold text-slate-400">{t('benefits')}:</span>
            <span className="text-sm font-bold text-orange-400">
              {/* Format if clean numeric value, else preserve original string */}
              {/^\d+$/.test(scheme.benefits_amount.trim()) 
                ? formatIndianCurrency(scheme.benefits_amount.trim()) 
                : scheme.benefits_amount}
            </span>
          </div>
        )}

        {/* Collapsible toggle */}
        <div className="flex items-center justify-between border-t border-white/[0.05] pt-3 mt-1">
          <button
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold hover:text-blue-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none p-1 rounded"
          >
            {expanded ? (
              <>
                <span>Hide Details</span>
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              </>
            ) : (
              <>
                <span>View Details & Apply</span>
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </>
            )}
          </button>

          {isMatchedView && (
            <button
              onClick={handleExplain}
              disabled={aiLoading}
              aria-label="Explain eligibility with AI"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none ${
                aiExplanation 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
              }`}
            >
              <Sparkles className="h-3 w-3 animate-pulse" aria-hidden="true" />
              {aiLoading ? 'Analyzing...' : aiExplanation ? 'AI Ready' : t('explainWhy')}
            </button>
          )}
        </div>

        {/* Expanded Area */}
        {expanded && (
          <div className="border-t border-white/[0.08] pt-4 space-y-4 animate-fade-in text-sm text-slate-300">
            {/* Description */}
            {scheme.benefits && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                  {t('benefits')}
                </h4>
                <p className="text-sm bg-white/[0.01] p-3 rounded-xl border border-white/[0.03] leading-relaxed">
                  {displayBenefits}
                </p>
              </div>
            )}

            {/* AI Explanation details */}
            {isMatchedView && aiExplanation && (
              <div className="space-y-1.5 bg-orange-500/5 border border-orange-500/10 p-4 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  AI Match Analysis
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed italic">
                  "{aiExplanation}"
                </p>
              </div>
            )}

            {/* Documents */}
            {scheme.required_documents && scheme.required_documents.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t('documents')}
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {scheme.required_documents.map((doc, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs bg-slate-800/50 p-2 rounded-lg border border-white/[0.04]">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Details Grid (Helpline, Deadline, Links) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.05]">
              {scheme.helpline && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Phone className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
                  <span>{t('helpline')}: <strong className="text-slate-200">{scheme.helpline}</strong></span>
                </div>
              )}
              {scheme.deadline && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
                  <span>{t('deadline')}: <strong className="text-slate-200">{formatIndianDate(scheme.deadline)}</strong></span>
                </div>
              )}
            </div>

            {/* Application URL */}
            {scheme.application_url && (
              <div className="pt-2 flex justify-end">
                <a
                  href={scheme.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                >
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('applyNow')}
                </a>
              </div>
            )}

            {/* View Full Details Link */}
            <div className="pt-2 flex justify-center border-t border-white/[0.05]">
              <Link
                href={`/schemes/${scheme.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-500/5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                View Full Details →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default SchemeCard;
