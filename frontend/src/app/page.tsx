'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EligibilityForm } from '../components/eligibility/EligibilityForm';
import { ShieldCheck, Award, Users, BookOpen } from 'lucide-react';
import { api } from '../lib/api';

export default function Home() {
  const { t } = useApp();
  const [totalSchemes, setTotalSchemes] = useState<number | null>(null);

  useEffect(() => {
    api.getSchemes({ pageSize: 1, activeOnly: true })
      .then(res => setTotalSchemes(res.total))
      .catch(err => console.error('Failed to fetch scheme stats:', err));
  }, []);

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-start py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Rings */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] rounded-full bg-orange-500/20 blur-[80px]" />
      </div>

      <div className="mx-auto max-w-7xl w-full flex flex-col lg:flex-row gap-12 items-center justify-between relative z-10">
        {/* Left Column: Hero & Statistics */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 text-xs font-semibold text-blue-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Direct Matching • Verified Government Rules</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              {t('heroTitle').includes("You Qualify For") ? (
                <>
                  <span className="block text-slate-100">{t('heroTitle').split("You Qualify For")[0]}</span>
                  <span className="block bg-gradient-to-r from-orange-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    You Qualify For
                  </span>
                </>
              ) : (
                <span className="block text-slate-100">{t('heroTitle')}</span>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0">
              {t('heroSubtitle')}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <BookOpen className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-100">
                  {totalSchemes !== null ? `${totalSchemes}+` : '130+'}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Schemes</div>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Users className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-100">9</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Categories</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="w-full lg:max-w-xl">
          <EligibilityForm />
        </div>
      </div>
    </div>
  );
}
