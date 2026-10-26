'use client';

import React from 'react';
import { EligibilityForm } from '../../components/eligibility/EligibilityForm';
import { ShieldCheck, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function EligibilityPage() {
  return (
    <div className="mx-auto max-w-4xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Title Header */}
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Multi-Criteria Citizen Evaluation</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-100">
          Citizen Eligibility Quick-Checker
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Provide your demographic details below. Our engine checks your criteria against verified Central and State government welfare rules.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-2xl mx-auto">
        <EligibilityForm />
      </div>

      {/* Verification Trust Footer */}
      <div className="gov-card p-4 sm:p-5 rounded-2xl border border-white/[0.08] flex items-center justify-between gap-4 text-xs text-slate-400 bg-[#0E1422] max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <span>100% Deterministic Rule Check • Local Browser Storage Only</span>
        </div>
        <Link href="/schemes" className="text-blue-400 font-bold hover:underline hidden sm:inline-flex items-center gap-1">
          <span>Browse All Schemes</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
