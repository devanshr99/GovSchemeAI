'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import Link from 'next/link';
import { ArrowLeft, Sparkles, AlertCircle, FileText, Loader2, SlidersHorizontal } from 'lucide-react';

export default function Results() {
  const { results, t } = useApp();

  const [scanning, setScanning] = useState<boolean>(true);
  const [scanStep, setScanStep] = useState<number>(0);

  const scanSteps = [
    'Parsing citizen demographic parameters...',
    'Evaluating state and regional criteria constraints...',
    'Matching annual household income thresholds...',
    'Verifying occupational qualifications & welfare matrices...',
    'Finalizing personalized scheme recommendations...'
  ];

  useEffect(() => {
    if (!results) return;
    
    const interval = setInterval(() => {
      setScanStep(prev => {
        if (prev >= scanSteps.length - 1) {
          clearInterval(interval);
          setScanning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [results, scanSteps.length]);

  if (!results) {
    return (
      <div className="mx-auto max-w-3xl w-full py-16 px-4 text-center space-y-6 animate-fade-in relative z-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0E1017] border border-white/[0.08]">
          <AlertCircle className="h-8 w-8 text-purple-400" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-slate-100">No Active Match Profile Found</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
            Please run the quick-scan eligibility form first to evaluate criteria parameters against official schemes.
          </p>
        </div>
        <div>
          <Link
            href="/eligibility"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go to Eligibility Checker</span>
          </Link>
        </div>
      </div>
    );
  }

  if (scanning) {
    return (
      <div className="mx-auto max-w-md w-full py-28 px-4 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in relative z-10">
        <div className="relative h-16 w-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-white/[0.08] border-t-purple-500 animate-spin" style={{ animationDuration: '1.2s' }} />
          <Sparkles className="h-7 w-7 text-purple-400 animate-pulse" />
        </div>

        <div className="space-y-1">
          <h2 className="font-heading text-xl font-black text-slate-100">Evaluating Eligibility Rules</h2>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Deterministic Engine Matching
          </p>
        </div>

        <div className="gov-card w-full rounded-2xl p-4 border border-white/[0.08] text-xs text-slate-300 font-medium flex items-center justify-center gap-2.5 bg-[#0E1017]">
          <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
          <span>{scanSteps[scanStep]}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1.5">
          <Link href="/eligibility" className="inline-flex items-center gap-1.5 text-xs text-purple-400 font-semibold hover:underline mb-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Refine Search Profile</span>
          </Link>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-100">{t('matchedResults')}</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Scanned <strong className="text-slate-100">{results.total_schemes_checked}</strong> schemes based on: <span className="text-purple-300 font-semibold">{results.profile_summary}</span>
          </p>
        </div>

        {/* Count Card */}
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 bg-[#0E1017] border border-emerald-500/30 rounded-2xl text-center shadow-xs">
            <div className="font-heading text-3xl font-black text-emerald-400 leading-none">{results.eligible_count}</div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mt-1">Eligible Schemes</div>
          </div>
        </div>
      </div>

      {/* AI Summary Banner */}
      {results.ai_summary && (
        <div className="gov-card border-l-4 border-l-purple-500 p-5 sm:p-6 space-y-2 bg-[#0E1017] border border-white/[0.08] rounded-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <h2 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">{t('aiSummaryTitle')}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
            &ldquo;{results.ai_summary}&rdquo;
          </p>
        </div>
      )}

      {/* Results List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.schemes.length > 0 ? (
          results.schemes.map((scheme, idx) => (
            <div 
              key={scheme.id} 
              className="animate-slide-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <SchemeCard scheme={scheme} isMatchedView={true} />
            </div>
          ))
        ) : (
          <div className="gov-card col-span-2 rounded-3xl p-12 text-center space-y-4 border border-white/[0.08] max-w-lg mx-auto">
            <FileText className="h-10 w-10 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-heading text-base font-bold text-slate-100">No Direct Matches Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No schemes matched your exact income or land constraints. Try widening your criteria parameters.
              </p>
            </div>
            <Link
              href="/eligibility"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Adjust Profile Parameters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
