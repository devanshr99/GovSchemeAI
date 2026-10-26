'use client';

import React from 'react';
import { EligibilityForm } from '../../components/eligibility/EligibilityForm';
import { ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function EligibilityPage() {
  return (
    <div className="mx-auto max-w-4xl w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Title Header */}
      <div className="space-y-3 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F3EC] text-[#176B52] border border-[#176B52]/20 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-[#E8A126]" />
          <span>Multi-Criteria Citizen Evaluation</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#202820]">
          Citizen Eligibility Quick-Scan
        </h1>
        <p className="text-xs sm:text-sm text-[#687368] leading-relaxed">
          Provide your demographic details below. Our deterministic engine checks your criteria against verified Central and State government welfare rules.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-xl mx-auto">
        <EligibilityForm />
      </div>

      {/* Verification Trust Footer */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[#E5E9E3] flex items-center justify-between gap-4 text-xs text-[#687368] bg-white max-w-xl mx-auto shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#176B52]" />
          <span>100% Deterministic Rule Check • Local Browser Storage Only</span>
        </div>
        <Link href="/schemes" className="text-[#176B52] font-semibold hover:underline hidden sm:inline-flex items-center gap-1">
          <span>Browse All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
