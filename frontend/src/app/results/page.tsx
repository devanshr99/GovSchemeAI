'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import Link from 'next/link';
import { ArrowLeft, Sparkles, AlertCircle, FileText } from 'lucide-react';

export default function Results() {
  const { results, profile, t } = useApp();

  if (!results) {
    return (
      <div className="mx-auto max-w-3xl w-full py-16 px-4 text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 border border-white/[0.08]">
          <AlertCircle className="h-8 w-8 text-orange-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-100">No Active Match Profile Found</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Please fill in your profile details first so we can check which government schemes you are eligible for.
          </p>
        </div>
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Eligibility Form
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl w-full py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Navigation / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-semibold hover:text-blue-300 transition-colors mb-2">
            <ArrowLeft className="h-3 w-3" />
            Refine Profile
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-100">{t('matchedResults')}</h1>
          <p className="text-xs text-slate-400">
            Scanned <strong className="text-slate-200">{results.total_schemes_checked}</strong> schemes based on: <span className="text-blue-400 italic font-medium">{results.profile_summary}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
            <div className="text-2xl font-black text-emerald-400">{results.eligible_count}</div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Eligible Schemes</div>
          </div>
        </div>
      </div>

      {/* AI Summary Panel */}
      {results.ai_summary && (
        <div className="glass-panel border-l-4 border-l-orange-500 rounded-2xl p-5 sm:p-6 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-orange-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-400 animate-pulse" />
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">{t('aiSummaryTitle')}</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {results.ai_summary}
          </p>
        </div>
      )}

      {/* Matching Schemes List */}
      <div className="space-y-6">
        {results.schemes.length > 0 ? (
          results.schemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} isMatchedView={true} />
          ))
        ) : (
          <div className="glass-panel rounded-2xl p-8 text-center space-y-4">
            <FileText className="h-10 w-10 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-300">No Matches Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find any schemes matching your specific parameters. Try refining your profile or adjusting your income.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
