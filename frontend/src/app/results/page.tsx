'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, FileText, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

export default function Results() {
  const { results, profile, t } = useApp();

  const [scanning, setScanning] = useState<boolean>(true);
  const [scanStep, setScanStep] = useState<number>(0);

  const scanSteps = [
    'Evaluating citizen demographic parameters...',
    'Matching state and regional criteria...',
    'Verifying annual household income limits...',
    'Testing occupational qualifications...',
    'Finalizing official scheme recommendations...'
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
      <div className="mx-auto max-w-3xl w-full py-16 px-4 text-center space-y-6 animate-fade-in">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-white/[0.08]">
          <AlertCircle className="h-8 w-8 text-amber-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-100">No Active Questionnaire Evaluation Found</h2>
          <p className="text-slate-400 max-w-md mx-auto text-xs sm:text-sm leading-relaxed">
            Please complete the citizen profile questionnaire first to evaluate your scheme eligibility against official rules.
          </p>
        </div>
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Questionnaire
          </Link>
        </div>
      </div>
    );
  }

  if (scanning) {
    return (
      <div className="mx-auto max-w-md w-full py-28 px-4 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
        <div className="relative h-20 w-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-white/[0.04] border-t-blue-500 animate-spin" style={{ animationDuration: '1.2s' }} />
          <ShieldCheck className="h-8 w-8 text-blue-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-100">Official Evaluation Engine</h2>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Comparing profile against department gazettes
          </p>
        </div>

        <div className="gov-card w-full rounded-2xl p-4 border border-white/[0.08] text-xs text-slate-300 font-semibold flex items-center justify-center gap-2.5 shadow">
          <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
          <span>{scanSteps[scanStep]}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-semibold hover:text-blue-300 transition-colors mb-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            Adjust Questionnaire Inputs
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100">{t('matchedResults')}</h1>
          <p className="text-xs text-slate-400">
            Scanned <strong className="text-slate-200">{results.total_schemes_checked}</strong> government programs for: <span className="text-blue-300 font-semibold">{results.profile_summary}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-3 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 leading-none">{results.eligible_count}</div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mt-1">Matched Schemes</div>
          </div>
        </div>
      </div>

      {/* Official Summary Panel */}
      {results.ai_summary && (
        <div className="gov-card border-l-4 border-l-blue-500 rounded-2xl p-5 sm:p-6 space-y-2 border border-white/[0.08] shadow">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{t('aiSummaryTitle')}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {results.ai_summary}
          </p>
        </div>
      )}

      {/* Matching Schemes List */}
      <div className="space-y-4">
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
          <div className="gov-card rounded-3xl p-10 text-center space-y-3 border border-white/[0.08]">
            <FileText className="h-8 w-8 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-200">No Matching Schemes Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No active government schemes matched your specific profile inputs. Try adjusting your income or location parameters.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

