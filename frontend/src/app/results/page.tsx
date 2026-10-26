'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import { CompareFloatingBar } from '../../components/common/CompareFloatingBar';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  Loader2, 
  SlidersHorizontal,
  CheckCircle2,
  ShieldCheck,
  Printer,
  Share2,
  ExternalLink,
  Info
} from 'lucide-react';

export default function Results() {
  const { results, t } = useApp();

  const [scanning, setScanning] = useState<boolean>(true);
  const [scanStep, setScanStep] = useState<number>(0);
  const [levelFilter, setLevelFilter] = useState<'all' | 'central' | 'state'>('all');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

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
    }, 350);

    return () => clearInterval(interval);
  }, [results, scanSteps.length]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const filteredSchemes = useMemo(() => {
    if (!results || !results.schemes) return [];
    if (levelFilter === 'all') return results.schemes;
    return results.schemes.filter(s => s.level?.toLowerCase() === levelFilter);
  }, [results, levelFilter]);

  if (!results) {
    return (
      <div className="mx-auto max-w-2xl w-full py-20 px-4 text-center space-y-6 animate-fade-in relative z-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-slate-100">No Active Evaluation Profile Found</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Please run the 3-step eligibility checker first to evaluate your demographic parameters against verified government schemes.
          </p>
        </div>
        <div>
          <Link
            href="/eligibility"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Launch Eligibility Checker</span>
          </Link>
        </div>
      </div>
    );
  }

  if (scanning) {
    return (
      <div className="mx-auto max-w-md w-full py-28 px-4 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in relative z-10">
        <div className="relative h-16 w-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-slate-700/80 border-t-blue-500 animate-spin" style={{ animationDuration: '1s' }} />
          <ShieldCheck className="h-7 w-7 text-blue-400 animate-pulse" />
        </div>

        <div className="space-y-1">
          <h2 className="font-heading text-xl font-black text-slate-100">Evaluating Welfare Matrix</h2>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Deterministic Engine Matching Against Official Rules
          </p>
        </div>

        <div className="w-full rounded-2xl p-4 border border-slate-800 text-xs text-slate-300 font-medium flex items-center justify-center gap-2.5 bg-[#111827] shadow-lg">
          <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
          <span>{scanSteps[scanStep]}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-slate-800/80 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link 
              href="/eligibility" 
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-semibold hover:underline"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Modify Demographic Answers</span>
            </Link>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">
              Checked <strong className="text-slate-200">{results.total_schemes_checked}</strong> total database records
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-100">
            {t('matchedResults')}
          </h1>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400">Profile Criteria:</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-[#111827] border border-slate-800 text-slate-200 font-medium">
              {results.profile_summary}
            </span>
          </div>
        </div>

        {/* Action Controls & Stat Banner */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-5 py-3 bg-[#111827] border border-emerald-500/30 rounded-2xl text-center shadow-xs">
            <div className="font-heading text-3xl font-black text-emerald-400 leading-none">
              {results.eligible_count}
            </div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mt-1">
              Eligible Schemes
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2.5 rounded-xl bg-[#111827] hover:bg-[#1e293b] border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Print results summary"
            >
              <Printer className="h-4 w-4 text-slate-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-[#111827] hover:bg-[#1e293b] border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Copy share link"
            >
              <Share2 className="h-4 w-4 text-slate-400" />
              <span className="hidden sm:inline">{copiedShare ? 'Copied Link!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Summary Banner */}
      {results.ai_summary && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 sm:p-6 space-y-2 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <h2 className="text-xs font-extrabold text-blue-300 uppercase tracking-wider">
              {t('aiSummaryTitle')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
            &ldquo;{results.ai_summary}&rdquo;
          </p>
        </div>
      )}

      {/* Verification Notice */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-start gap-3 text-xs text-amber-200">
        <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="font-semibold block text-amber-300">Official Eligibility Notice</strong>
          <p className="text-slate-300 leading-relaxed">
            GovSchemeAI evaluates criteria against published guidelines. Final benefits sanctioning is solely conducted by the respective state or central government department upon submitting your attested documents.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLevelFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              levelFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white bg-[#111827] border border-slate-800'
            }`}
          >
            All Matches ({results.schemes.length})
          </button>
          <button
            type="button"
            onClick={() => setLevelFilter('central')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              levelFilter === 'central'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white bg-[#111827] border border-slate-800'
            }`}
          >
            Central Only
          </button>
          <button
            type="button"
            onClick={() => setLevelFilter('state')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              levelFilter === 'state'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white bg-[#111827] border border-slate-800'
            }`}
          >
            State Only
          </button>
        </div>

        <Link
          href="/chat"
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 hover:underline"
        >
          <span>Ask Advisor about these results</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {filteredSchemes.length > 0 ? (
          filteredSchemes.map((scheme, idx) => (
            <div 
              key={scheme.id} 
              className="animate-slide-up"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <SchemeCard scheme={scheme} isMatchedView={true} />
            </div>
          ))
        ) : (
          <div className="col-span-2 rounded-3xl p-12 text-center space-y-4 border border-slate-800 bg-[#111827] max-w-lg mx-auto">
            <FileText className="h-10 w-10 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-heading text-base font-bold text-slate-100">No Direct Matches Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                No schemes matched your exact constraints under this filter. Try widening your income threshold or changing filters.
              </p>
            </div>
            <Link
              href="/eligibility"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
            >
              Adjust Profile Parameters
            </Link>
          </div>
        )}
      </div>

      {/* Floating Compare Bar */}
      <CompareFloatingBar />
    </div>
  );
}
