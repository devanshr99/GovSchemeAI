'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import Link from 'next/link';
import { ArrowLeft, Sparkles, AlertCircle, FileText, Loader2 } from 'lucide-react';

export default function Results() {
  const { results, t } = useApp();

  const [scanning, setScanning] = useState<boolean>(true);
  const [scanStep, setScanStep] = useState<number>(0);

  const scanSteps = [
    'Parsing citizen demographic parameters...',
    'Evaluating state and regional constraints...',
    'Comparing annual household income thresholds...',
    'Verifying occupational qualifications...',
    'Finalizing personalized scheme recommendations...'
  ];

  useEffect(() => {
    if (!results) return;
    setScanning(true);
    setScanStep(0);
    
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
  }, [results]);

  if (!results) {
    return (
      <div className="mx-auto max-w-3xl w-full py-16 px-4 text-center space-y-6 animate-fade-in relative z-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#101217] border border-[#242832]">
          <AlertCircle className="h-8 w-8 text-[#A855F7]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#F5F5F7]">No Active Match Profile Found</h2>
          <p className="text-[#A1A1AA] text-xs max-w-md mx-auto">
            Please complete the eligibility quick-check form first to evaluate rule parameters.
          </p>
        </div>
        <div>
          <Link
            href="/eligibility"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-bold shadow-lg transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Eligibility Checker
          </Link>
        </div>
      </div>
    );
  }

  if (scanning) {
    return (
      <div className="mx-auto max-w-md w-full py-28 px-4 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in relative z-10">
        <div className="relative h-16 w-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#242832] border-t-[#8B5CF6] animate-spin" style={{ animationDuration: '1.2s' }} />
          <Sparkles className="h-7 w-7 text-[#A855F7] animate-pulse" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-[#F5F5F7]">Evaluating Eligibility Rules</h2>
          <p className="text-[10px] text-[#71717A] font-semibold uppercase tracking-wider">
            Deterministic Engine Matching
          </p>
        </div>

        <div className="gov-card w-full rounded-2xl p-4 border-[#242832] text-xs text-[#A1A1AA] font-medium flex items-center justify-center gap-2.5">
          <Loader2 className="h-4 w-4 text-[#A855F7] animate-spin" />
          <span>{scanSteps[scanStep]}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl w-full py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#242832] pb-6">
        <div className="space-y-1">
          <Link href="/eligibility" className="inline-flex items-center gap-1.5 text-xs text-[#A855F7] font-semibold hover:underline mb-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Refine Search Profile
          </Link>
          <h1 className="text-3xl font-black text-[#F5F5F7]">{t('matchedResults')}</h1>
          <p className="text-xs text-[#A1A1AA]">
            Scanned <strong className="text-[#F5F5F7]">{results.total_schemes_checked}</strong> schemes based on: <span className="text-[#A855F7] font-semibold">{results.profile_summary}</span>
          </p>
        </div>

        {/* Count Card */}
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 bg-[#101217] border border-[#22C55E]/30 rounded-2xl text-center">
            <div className="text-3xl font-black text-[#22C55E] leading-none">{results.eligible_count}</div>
            <div className="text-[8px] uppercase font-bold tracking-wider text-[#71717A] mt-1">Eligible Schemes</div>
          </div>
        </div>
      </div>

      {/* AI Summary Banner */}
      {results.ai_summary && (
        <div className="gov-card border-l-4 border-l-[#8B5CF6] p-5 sm:p-6 space-y-2 bg-[#0D0F14]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#A855F7]" />
            <h2 className="text-xs font-extrabold text-[#F5F5F7] uppercase tracking-wider">{t('aiSummaryTitle')}</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#F5F5F7] leading-relaxed">
            {results.ai_summary}
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
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <SchemeCard scheme={scheme} isMatchedView={true} />
            </div>
          ))
        ) : (
          <div className="gov-card col-span-2 rounded-2xl p-12 text-center space-y-4">
            <FileText className="h-10 w-10 text-[#71717A] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F5F5F7]">No Direct Matches Found</h3>
              <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
                No schemes matched your exact income or land constraints. Try widening your criteria.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
