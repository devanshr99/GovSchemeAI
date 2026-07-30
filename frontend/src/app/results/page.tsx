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
    'Finalizing personalized AI recommendations...'
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

  // Scanning progress state view
  if (scanning) {
    return (
      <div className="mx-auto max-w-md w-full py-28 px-4 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
        <div className="relative h-20 w-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-white/[0.04] border-t-blue-500 animate-spin" style={{ animationDuration: '1.2s' }} />
          <Sparkles className="h-8 w-8 text-blue-400 animate-pulse" />
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-black text-slate-100">Eligibility Engine</h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider h-4">
            Scanning 130+ schemes
          </p>
        </div>

        {/* Stepper text indicator */}
        <div className="glass-panel w-full rounded-2xl p-4 border-white/[0.06] text-xs text-slate-300 font-medium flex items-center justify-center gap-2.5 animate-pulse">
          <Loader2 className="h-4 w-4 text-orange-400 animate-spin" />
          <span>{scanSteps[scanStep]}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl w-full py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
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

        {/* Circular eligibility score count */}
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl text-center">
            <div className="text-3xl font-black text-emerald-400 leading-none">{results.eligible_count}</div>
            <div className="text-[8px] uppercase font-bold tracking-wider text-slate-400 mt-1">Eligible Schemes</div>
          </div>
        </div>
      </div>

      {/* AI Summary Panel */}
      {results.ai_summary && (
        <div className="glass-panel border-l-4 border-l-orange-500 rounded-2xl p-5 sm:p-6 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-orange-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-400 animate-pulse" />
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">{t('aiSummaryTitle')}</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-semibold">
            {results.ai_summary}
          </p>
        </div>
      )}

      {/* Matching Schemes List */}
      <div className="space-y-6">
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
