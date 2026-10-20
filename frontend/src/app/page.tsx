'use client';

import React, { useState, useEffect } from 'react';
import { EligibilityForm } from '../components/eligibility/EligibilityForm';
import { SchemeCard } from '../components/schemes/SchemeCard';
import { AmazingButton } from '../components/common/AmazingButton';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck, 
  Search, 
  Sparkles, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  GraduationCap, 
  Rocket, 
  Sprout, 
  HeartHandshake, 
  Briefcase, 
  Building2,
  ArrowRight, 
  Bot,
  Lock,
  Layers,
  FileCheck2
} from 'lucide-react';
import { api } from '../lib/api';
import { EligibleSchemeResult } from '../types/eligibility';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { t } = useApp();
  const [totalSchemes, setTotalSchemes] = useState<number | null>(null);
  const [featuredSchemes, setFeaturedSchemes] = useState<EligibleSchemeResult[]>([]);
  const [heroSearch, setHeroSearch] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    // Fetch live statistics and featured schemes from backend
    api.getSchemes({ pageSize: 6, activeOnly: true })
      .then(res => {
        setTotalSchemes(res.total);
        if (res.schemes && res.schemes.length > 0) {
          const mapped: EligibleSchemeResult[] = res.schemes.map(item => ({
            ...item,
            match_score: 1.0,
            rules_matched: 1,
            rules_total: 1,
            rules_evaluation: ['✓ Direct Ministry Scheme', '✓ Citizen Discovery Active']
          }));
          setFeaturedSchemes(mapped);
        }
      })
      .catch(err => console.error('Failed to load home data:', err));
  }, []);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      router.push(`/schemes?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      router.push('/schemes');
    }
  };

  const sectorHubs = [
    { 
      title: 'Student Hub', 
      slug: 'student', 
      icon: GraduationCap, 
      desc: 'National & State scholarships, fee waivers, education loans & research stipends.',
      color: 'text-purple-400',
      badge: 'Scholarships & Grants'
    },
    { 
      title: 'Startup Hub', 
      slug: 'startup', 
      icon: Rocket, 
      desc: 'Mudra business loans, Startup India seed funding, patent fee rebates & incubators.',
      color: 'text-cyan-400',
      badge: 'Seed Capital & Credit'
    },
    { 
      title: 'Farmer Hub', 
      slug: 'farmer', 
      icon: Sprout, 
      desc: 'PM-KISAN installment credits, crop insurance, fertilizer aid & solar pump subsidies.',
      color: 'text-emerald-400',
      badge: 'Direct Benefit Transfer'
    },
    { 
      title: 'Women Welfare', 
      slug: 'women', 
      icon: HeartHandshake, 
      desc: 'Maternity assistance, self-help group credits, girl child education & health plans.',
      color: 'text-pink-400',
      badge: 'Health & Empowerment'
    },
    { 
      title: 'Youth & Skill', 
      slug: 'youth', 
      icon: Briefcase, 
      desc: 'Skill development, apprenticeship allowances, employment registration benefits.',
      color: 'text-amber-400',
      badge: 'Apprenticeships'
    },
    { 
      title: 'MSME & Business', 
      slug: 'msme', 
      icon: Building2, 
      desc: 'Micro enterprise collateral-free credit, machinery subsidy & export promotion.',
      color: 'text-indigo-400',
      badge: 'Udyam Credit'
    },
  ];

  const popularSearches = [
    'PM-KISAN',
    'Scholarship',
    'Mudra Loan',
    'Matru Vandana',
    'Housing Aid',
    'Pension'
  ];

  const faqs = [
    {
      q: "How does GovSchemeAI evaluate scheme eligibility?",
      a: "Our engine evaluates demographic parameters (age, annual income limit, gender, state residence, category, land holding, and occupation) directly against verified official eligibility criteria published by government ministries."
    },
    {
      q: "Is GovSchemeAI an official government portal?",
      a: "GovSchemeAI is an independent citizen discovery platform. We index centralized and state government schemes from official sources and direct citizens directly to verified government portal links (.gov.in / .nic.in) for submission."
    },
    {
      q: "Is my personal data stored or shared?",
      a: "No. Your profile parameters are processed temporarily in your browser session and saved exclusively in local storage on your device for your own discovery convenience. No citizen data is sold."
    },
    {
      q: "How are scheme details kept accurate?",
      a: "Our indexing engine regularly tracks official circulars, ministry portals, budget allocations, and gazette notifications to ensure eligibility criteria, required documents, and deadlines remain current."
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-start py-6 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24 overflow-hidden">
      
      {/* HERO SECTION */}
      <section className="mx-auto max-w-7xl w-full flex flex-col lg:flex-row gap-10 lg:gap-14 items-center justify-between relative z-10 pt-2 sm:pt-6">
        
        {/* Left Hero Content */}
        <div className="flex-1 space-y-7 text-left animate-fade-in w-full">
          
          <div className="space-y-4">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-xs font-semibold text-purple-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="tracking-wider uppercase text-[10px] font-bold">
                Direct Citizen Discovery Engine • Verified Government Schemes
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-slate-100">
              {t('heroTitle')}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              {t('heroSubtitle')}
            </p>
          </div>

          {/* Quick Search Bar */}
          <form onSubmit={handleHeroSearchSubmit} className="max-w-xl relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search scheme name, ministry, or benefit (e.g. PM-KISAN, Scholarship)..."
                className="w-full pl-11 pr-28 py-3.5 rounded-2xl text-xs sm:text-sm bg-[#0E1017] border border-white/[0.1] text-slate-100 placeholder-slate-500 focus:border-purple-500 shadow-md"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Search
              </button>
            </div>
            
            {/* Popular Search Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Popular:</span>
              {popularSearches.map((term, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => router.push(`/schemes?search=${encodeURIComponent(term)}`)}
                  className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#0E1017] border border-white/[0.06] text-slate-400 hover:text-white hover:border-purple-500/30 transition-all cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </form>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <AmazingButton
              href="#eligibility-form"
              variant="gradient"
              size="md"
              icon={<Sparkles className="h-4 w-4" />}
              iconPosition="left"
            >
              Check My Eligibility in 60s
            </AmazingButton>
            <AmazingButton
              href="/schemes"
              variant="secondary"
              size="md"
              icon={<Layers className="h-4 w-4 text-slate-400" />}
              iconPosition="left"
            >
              Browse All Schemes
            </AmazingButton>
          </div>

          {/* Live Verified Platform Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-2xl">
            <div className="gov-card p-3 rounded-xl border border-white/[0.08]">
              <div className="font-heading text-xl sm:text-2xl font-black text-slate-100">
                {totalSchemes !== null ? totalSchemes : '130+'}
              </div>
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mt-0.5">Active Schemes</div>
            </div>

            <div className="gov-card p-3 rounded-xl border border-white/[0.08]">
              <div className="font-heading text-xl sm:text-2xl font-black text-purple-400">36</div>
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mt-0.5">States & UTs</div>
            </div>

            <div className="gov-card p-3 rounded-xl border border-white/[0.08]">
              <div className="font-heading text-xl sm:text-2xl font-black text-cyan-400">50+</div>
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mt-0.5">Departments</div>
            </div>

            <div className="gov-card p-3 rounded-xl border border-white/[0.08]">
              <div className="font-heading text-xl sm:text-2xl font-black text-emerald-400">100%</div>
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mt-0.5">Verified Links</div>
            </div>
          </div>

        </div>

        {/* Right Hero Panel: Citizen Eligibility Quick-Scan Form */}
        <div id="eligibility-form" className="w-full lg:max-w-lg animate-slide-up shrink-0">
          <EligibilityForm />
        </div>
      </section>

      {/* SECTOR HUBS SECTION */}
      <section className="mx-auto max-w-7xl w-full space-y-6 relative z-10" aria-labelledby="sector-hubs-title">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-purple-400">
              Categorized Citizen Portals
            </span>
            <h2 id="sector-hubs-title" className="font-heading text-2xl sm:text-3xl font-black text-slate-100 mt-1">
              Explore Dedicated Sector Hubs
            </h2>
          </div>
          <Link
            href="/hubs"
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Hubs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sectorHubs.map((hub) => {
            const Icon = hub.icon;
            return (
              <Link
                key={hub.slug}
                href={`/hubs/${hub.slug}`}
                className="gov-card gov-card-hover p-6 rounded-2xl flex flex-col justify-between space-y-4 group cursor-pointer border border-white/[0.08]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-xl bg-[#0E1017] border border-white/[0.08] flex items-center justify-center group-hover:border-purple-500/40 transition-colors">
                      <Icon className={`h-5 w-5 ${hub.color}`} />
                    </div>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                      {hub.badge}
                    </span>
                  </div>

                  <h3 className="font-heading text-base font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                    {hub.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {hub.desc}
                  </p>
                </div>

                <div className="flex items-center text-xs font-bold text-purple-400 pt-2 border-t border-white/[0.04]">
                  <span>Explore {hub.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED SCHEMES GRID */}
      {featuredSchemes.length > 0 && (
        <section className="mx-auto max-w-7xl w-full space-y-6 relative z-10" aria-labelledby="featured-schemes-title">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-cyan-400">
                Indexed Welfare Matrix
              </span>
              <h2 id="featured-schemes-title" className="font-heading text-2xl sm:text-3xl font-black text-slate-100 mt-1">
                Featured Government Opportunities
              </h2>
            </div>
            <Link
              href="/schemes"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              <span>Browse All {totalSchemes ? `${totalSchemes}+` : ''} Schemes</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSchemes.map((scheme) => (
              <SchemeCard key={scheme.slug} scheme={scheme} isMatchedView={false} />
            ))}
          </div>
        </section>
      )}

      {/* 4-STEP HOW IT WORKS JOURNEY */}
      <section className="mx-auto max-w-7xl w-full space-y-8 relative z-10" aria-labelledby="process-title">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-purple-400">
            Citizen Journey
          </span>
          <h2 id="process-title" className="font-heading text-2xl sm:text-3xl font-black text-slate-100">
            How GovSchemeAI Works
          </h2>
          <p className="text-xs text-slate-400">
            Four deterministic stages connecting citizen criteria with official government benefit disbursement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="gov-card p-6 rounded-2xl border border-white/[0.08] space-y-3 relative">
            <span className="font-heading text-2xl font-black text-purple-500/30">01</span>
            <h3 className="font-heading text-sm font-bold text-slate-100">Profile Demographics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Input age, household income limit, state residence, category, and occupation parameters.
            </p>
          </div>

          <div className="gov-card p-6 rounded-2xl border border-white/[0.08] space-y-3 relative">
            <span className="font-heading text-2xl font-black text-purple-500/30">02</span>
            <h3 className="font-heading text-sm font-bold text-slate-100">Rule Validation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic rule evaluation scans official central & state ministry criteria matrices.
            </p>
          </div>

          <div className="gov-card p-6 rounded-2xl border border-white/[0.08] space-y-3 relative">
            <span className="font-heading text-2xl font-black text-purple-500/30">03</span>
            <h3 className="font-heading text-sm font-bold text-slate-100">Match Classification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Schemes are mapped with match scores, criteria breakdown, and financial benefit estimations.
            </p>
          </div>

          <div className="gov-card p-6 rounded-2xl border border-white/[0.08] space-y-3 relative">
            <span className="font-heading text-2xl font-black text-purple-500/30">04</span>
            <h3 className="font-heading text-sm font-bold text-slate-100">Direct Application</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Review document guidelines and submit applications directly on official government domain links (.gov.in).
            </p>
          </div>
        </div>
      </section>

      {/* TRUST & PRIVACY ASSURANCES */}
      <section className="mx-auto max-w-7xl w-full relative z-10">
        <div className="gov-card rounded-3xl p-6 sm:p-8 border border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0E1017]">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-slate-100">Privacy Preserved</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All profile parameters remain on your local device. We never sell, share, or monetize citizen demographic inputs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-slate-100">Direct Official Links</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every scheme directs citizens directly to verified portals (.gov.in or .nic.in). No intermediary commission or third-party redirection.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-slate-100">Continuous Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Eligibility matrices and application procedures are synchronized with department notifications and circulars.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="mx-auto max-w-3xl w-full space-y-6 relative z-10" aria-labelledby="faq-title">
        <div className="text-center space-y-2">
          <h2 id="faq-title" className="font-heading text-2xl sm:text-3xl font-black text-slate-100 flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-purple-400" />
            <span>Frequently Asked Questions</span>
          </h2>
          <p className="text-xs text-slate-400">
            Common clarifications regarding scheme eligibility evaluation and official portal submissions.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="gov-card rounded-xl overflow-hidden border border-white/[0.08] transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left flex justify-between items-center hover:bg-white/[0.02] transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-xs sm:text-sm text-slate-200">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/[0.06] bg-[#0E1017] animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="mx-auto max-w-5xl w-full relative z-10 pt-2">
        <div className="gov-card rounded-3xl p-8 sm:p-12 border border-purple-500/30 text-center space-y-6 relative overflow-hidden bg-gradient-to-br from-[#11131C] via-[#161926] to-[#0E1017]">
          <div className="space-y-2 relative z-10">
            <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-100">
              Ready to Discover Your Eligible Benefits?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Run a quick 60-second eligibility check or consult our AI Scheme Advisor for document assistance.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3.5 relative z-10">
            <a
              href="#eligibility-form"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Check Eligibility Now</span>
            </a>
            <Link
              href="/chat"
              className="px-6 py-3 bg-[#0E1017] hover:bg-[#151824] border border-white/[0.08] text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <Bot className="h-4 w-4 text-purple-400" />
              <span>Ask Citizen Advisor AI</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
