'use client';

import React from 'react';
import { EligibilityForm } from '../../components/eligibility/EligibilityForm';
import { ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EligibilityPage() {
  return (
    <div className="mx-auto max-w-4xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Title Header */}
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
          <UserCheck className="h-3.5 w-3.5" />
          <span>Multi-Criteria Rules Engine</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-100">
          Citizen Eligibility Quick-Checker
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Provide your basic demographic parameters below. Our engine checks your criteria against verified Central and State government welfare rules.
        </p>
      </div>

      {/* Progress Steps Indicator */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto">
        <div className="gov-card p-3 text-center border-purple-500/40 bg-purple-600/10">
          <span className="font-heading text-xs font-black text-purple-400 block">01</span>
          <span className="text-[10px] text-slate-100 font-bold block truncate">Demographics</span>
        </div>

        <div className="gov-card p-3 text-center border-white/[0.08] bg-[#0E1017]">
          <span className="font-heading text-xs font-black text-slate-500 block">02</span>
          <span className="text-[10px] text-slate-400 font-bold block truncate">Income & Land</span>
        </div>

        <div className="gov-card p-3 text-center border-white/[0.08] bg-[#0E1017]">
          <span className="font-heading text-xs font-black text-slate-500 block">03</span>
          <span className="text-[10px] text-slate-400 font-bold block truncate">Welfare Criteria</span>
        </div>

        <div className="gov-card p-3 text-center border-white/[0.08] bg-[#0E1017]">
          <span className="font-heading text-xs font-black text-slate-500 block">04</span>
          <span className="text-[10px] text-slate-400 font-bold block truncate">Matched Schemes</span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="w-full">
        <EligibilityForm />
      </div>

      {/* Verification Trust Footer */}
      <div className="gov-card p-4 sm:p-5 rounded-2xl border border-white/[0.08] flex items-center justify-between gap-4 text-xs text-slate-400 bg-[#0E1017]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <span>100% Deterministic Rule Check • Local Browser Storage Only</span>
        </div>
        <Link href="/schemes" className="text-purple-400 font-bold hover:underline hidden sm:inline-flex items-center gap-1">
          <span>Skip to All Schemes</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
