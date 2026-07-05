'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EligibilityForm } from '../components/eligibility/EligibilityForm';
import {
  ShieldCheck,
  Award,
  Users,
  BookOpen,
  Brain,
  ClipboardCheck,
  Bot,
  Search,
  SlidersHorizontal,
  Database,
  RefreshCw,
  Sparkles,
  Zap,
  MonitorSmartphone,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
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
    <div className="relative min-h-[85vh] flex flex-col justify-start py-12 px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Background Decorative Rings */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] rounded-full bg-orange-500/20 blur-[80px]" />
      </div>

      {/* Hero & Form Section */}
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

      {/* Features Section */}
      <div className="mx-auto max-w-7xl w-full pt-10 relative z-10">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Our Powerful <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-orange-400 bg-clip-text text-transparent">Features</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            GovSchemeAI leverages advanced AI and structured data matching to offer a range of capabilities for citizens and agencies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {/* Card 1: AI Scheme Recommendation */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4 border border-white/[0.06] hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 mb-1 text-sm">AI Scheme Recommendation</h3>
              <p className="text-xs text-slate-400">Intelligent engine matching your profile with targeted government benefits.</p>
            </div>
          </div>

          {/* Card 2: Eligibility Checker */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4 border border-white/[0.06] hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 mb-1 text-sm">Eligibility Checker</h3>
              <p className="text-xs text-slate-400">Instantly check detailed qualifications for various central and state schemes.</p>
            </div>
          </div>

          {/* Card 3: AI Assistant */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4 border border-white/[0.06] hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 group-hover:scale-110 transition-transform">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 mb-1 text-sm">AI Assistant</h3>
              <p className="text-xs text-slate-400">Ask questions and receive instant guidance on applications and policies.</p>
            </div>
          </div>

          {/* Card 4: Government Scheme Search */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4 border border-white/[0.06] hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 mb-1 text-sm">Government Scheme Search</h3>
              <p className="text-xs text-slate-400">Quickly search through hundreds of indexed government opportunities.</p>
            </div>
          </div>

          {/* Card 5: Smart Filters */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4 border border-white/[0.06] hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 group-hover:scale-110 transition-transform">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 mb-1 text-sm">Smart Filters</h3>
              <p className="text-xs text-slate-400">Filter easily by state, ministry, levels, categories, and demographic groups.</p>
            </div>
          </div>

          {/* Card 6: Live Government Data */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4 border border-white/[0.06] hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 mb-1 text-sm">Live Government Data</h3>
              <p className="text-xs text-slate-400">Up-to-date program information scraped directly from official portals.</p>
            </div>
          </div>

          {/* Card 7: Automatic Updates */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4 border border-white/[0.06] hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 group-hover:scale-110 transition-transform">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 mb-1 text-sm">Automatic Updates</h3>
              <p className="text-xs text-slate-400">Continuous scans ensure criteria adjustments are instantly visible.</p>
            </div>
          </div>

          {/* Card 8: Personalized Suggestions */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4 border border-white/[0.06] hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 mb-1 text-sm">Personalized Suggestions</h3>
              <p className="text-xs text-slate-400">Dynamic recommendations tailored to occupation, state, age, and income.</p>
            </div>
          </div>

          {/* Card 9: Fast Search */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4 border border-white/[0.06] hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 group-hover:scale-110 transition-transform">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 mb-1 text-sm">Fast Search</h3>
              <p className="text-xs text-slate-400">Highly optimized database queries return matched results in milliseconds.</p>
            </div>
          </div>

          {/* Card 10: Responsive Design */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4 border border-white/[0.06] hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <MonitorSmartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 mb-1 text-sm">Responsive Design</h3>
              <p className="text-xs text-slate-400">Beautiful dashboard perfectly scaled for phones, tablets, and desktops.</p>
            </div>
          </div>
        </div>
      </div>

      {/* About & Problem We Solve Section */}
      <div className="mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pt-10 pb-16 relative z-10">
        {/* About GovSchemeAI card */}
        <div className="glass-panel p-8 rounded-2xl border border-white/[0.06] flex flex-col justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent mb-6">
              About GovSchemeAI
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              <p>
                GovSchemeAI is an AI-powered platform that simplifies the discovery of Indian Government welfare schemes.
              </p>
              <p>
                Millions of citizens struggle to find schemes they are eligible for because information is scattered across multiple ministry websites, eligibility criteria are difficult to understand, and application procedures are often confusing.
              </p>
              <p>
                GovSchemeAI solves this problem by providing personalized AI-powered recommendations, eligibility checking, intelligent search, government scheme discovery, document guidance, and application assistance through a simple and user-friendly interface.
              </p>
              <p>
                The platform is designed to make government welfare information accessible, understandable, and available to every citizen.
              </p>
            </div>
          </div>
        </div>

        {/* Problem We Solve card */}
        <div className="glass-panel p-8 rounded-2xl border border-white/[0.06] flex flex-col justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-6">
              Problem We Solve
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                  </div>
                  <span>Government schemes are distributed across many government portals.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                    <HelpCircle className="h-3 w-3" />
                  </div>
                  <span>Citizens often don't know which schemes they qualify for.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                  </div>
                  <span>Finding eligibility manually is difficult.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                    <HelpCircle className="h-3 w-3" />
                  </div>
                  <span>Required documents are confusing.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                  </div>
                  <span>Information changes frequently.</span>
                </li>
              </ul>
              <p className="mt-6 pt-6 border-t border-white/[0.06] text-slate-200 font-medium">
                GovSchemeAI centralizes this information and uses Artificial Intelligence to help users instantly discover relevant schemes based on their profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
