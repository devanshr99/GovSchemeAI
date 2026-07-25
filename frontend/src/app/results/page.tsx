'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import Link from 'next/link';
import { ArrowLeft, Sparkles, AlertCircle, FileText, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

export default function Results() {
  const { results, profile, t } = useApp();

  const [scanning, setScanning] = useState<boolean>(true);
  const [scanStep, setScanStep] = useState<number>(0);

  const scanSteps = [
    'Parsing citizen demographic parameters...',
    'Evaluating state and regional constraints...',
    'Comparing annual household income thresholds...',
    'Verifying occupational qualifications...',
    'Finalizing personalized recommendations...'
  ];

  // Micro-stepper animation to simulate deep rules scanning
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
    }, 450); // Total ~2.2 seconds scanning experience

    return () => clearInterval(interval);
  }, [results]);

  if (!results) {
    return (
      <div className="mx-auto max-w-3xl w-full py-16 px-4 text-center space-y-6 animate-fade-in">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#FFFBEB] border border-[#F59E0B]/20">
          <AlertCircle className="h-8 w-8 text-[#F59E0B]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#111827]">No Active Match Profile Found</h2>
          <p className="text-[#6B7280] max-w-md mx-auto">
            Please fill in your profile details first so we can check which government schemes you are eligible for.
          </p>
        </div>
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F766E] hover:bg-[#0D5F59] text-white rounded-lg font-semibold shadow-sm transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Eligibility Form
          </Link>
        </div>
      </div>
    );
  }

  // Scanning progress state view
  if (scanning) {
    return (
      <div className="mx-auto max-w-md w-full py-28 px-4 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
        <div className="relative h-20 w-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#E5E7EB] border-t-[#0F766E] animate-spin" style={{ animationDuration: '1.2s' }} />
          <ShieldCheck className="h-8 w-8 text-[#0F766E]" />
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold text-[#111827]">Eligibility Engine</h2>
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-4">
            Scanning 130+ schemes
          </p>
        </div>

        {/* Stepper text indicator */}
        <div className="glass-panel w-full rounded-xl p-4 text-xs text-[#374151] font-medium flex items-center justify-center gap-2.5">
          <Loader2 className="h-4 w-4 text-[#0F766E] animate-spin" />
          <span>{scanSteps[scanStep]}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl w-full py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      {/* Top Navigation / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E7EB] pb-6">
        <div className="space-y-1">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#0F766E] font-semibold hover:text-[#0D5F59] transition-colors mb-2">
            <ArrowLeft className="h-3 w-3" />
            Refine Profile
          </Link>
          <h1 className="text-3xl font-extrabold text-[#111827]">{t('matchedResults')}</h1>
          <p className="text-xs text-[#6B7280]">
            Scanned <strong className="text-[#111827]">{results.total_schemes_checked}</strong> schemes based on: <span className="text-[#0F766E] italic font-medium">{results.profile_summary}</span>
          </p>
        </div>

        {/* Circular eligibility score count */}
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 bg-[#F0FDFA] border border-[#0F766E]/15 rounded-xl text-center">
            <div className="text-3xl font-bold text-[#0F766E] leading-none">{results.eligible_count}</div>
            <div className="text-[9px] uppercase font-semibold tracking-wider text-[#6B7280] mt-1">Eligible Schemes</div>
          </div>
        </div>
      </div>

      {/* AI Summary Panel */}
      {results.ai_summary && (
        <div className="glass-panel border-l-4 border-l-[#F59E0B] rounded-xl p-5 sm:p-6 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#F59E0B]" />
            <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider">{t('aiSummaryTitle')}</h2>
          </div>
          <p className="text-sm text-[#374151] leading-relaxed">
            {results.ai_summary}
          </p>
        </div>
      )}

      {/* Matching Schemes List */}
      <div className="space-y-5">
        {results.schemes.length > 0 ? (
          results.schemes.map((scheme, idx) => (
            <div 
              key={scheme.id} 
              className="animate-slide-up"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <SchemeCard scheme={scheme} isMatchedView={true} />
            </div>
          ))
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
            <FileText className="h-10 w-10 text-[#9CA3AF] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#111827]">No Matches Found</h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                We couldn&apos;t find any schemes matching your specific parameters. Try refining your profile or adjusting your income.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
