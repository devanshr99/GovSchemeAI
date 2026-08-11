'use client';

import React from 'react';
import { EligibilityForm } from '../../components/eligibility/EligibilityForm';
import { ShieldCheck, UserCheck, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EligibilityPage() {
  return (
    <div className="mx-auto max-w-4xl w-full py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Title Header */}
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/15 text-[#A855F7] border border-[#8B5CF6]/30 text-xs font-bold uppercase tracking-wider">
          <UserCheck className="h-3.5 w-3.5" />
          <span>Multi-Criteria Rules Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#F5F5F7]">
          Citizen Eligibility Checker
        </h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
          Provide demographic parameters below. Our engine checks your criteria against centralized and state government scheme eligibility guidelines.
        </p>
      </div>

      {/* Progress Steps Indicator */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto">
        <div className="gov-card p-3 text-center border-[#8B5CF6]/40 bg-[#8B5CF6]/10">
          <span className="text-xs font-black text-[#A855F7] block">01</span>
          <span className="text-[10px] text-[#F5F5F7] font-bold block truncate">Personal</span>
        </div>

        <div className="gov-card p-3 text-center border-[#242832]">
          <span className="text-xs font-black text-[#71717A] block">02</span>
          <span className="text-[10px] text-[#A1A1AA] font-bold block truncate">Income</span>
        </div>

        <div className="gov-card p-3 text-center border-[#242832]">
          <span className="text-xs font-black text-[#71717A] block">03</span>
          <span className="text-[10px] text-[#A1A1AA] font-bold block truncate">Criteria</span>
        </div>

        <div className="gov-card p-3 text-center border-[#242832]">
          <span className="text-xs font-black text-[#71717A] block">04</span>
          <span className="text-[10px] text-[#A1A1AA] font-bold block truncate">Results</span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="w-full">
        <EligibilityForm />
      </div>

      {/* Verification Trust Footer */}
      <div className="gov-card p-5 rounded-2xl border-[#242832] flex items-center justify-between gap-4 text-xs text-[#A1A1AA]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#22C55E]" />
          <span>100% Deterministic Rule Check • No Personal Data Storage</span>
        </div>
        <Link href="/schemes" className="text-[#A855F7] font-bold hover:underline hidden sm:inline-flex items-center gap-1">
          <span>Skip to All Schemes</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
