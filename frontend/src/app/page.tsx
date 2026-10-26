'use client';

import React, { useState, useEffect } from 'react';
import { EligibilityForm } from '../components/eligibility/EligibilityForm';
import { SchemeCard } from '../components/schemes/SchemeCard';
import { AmazingButton } from '../components/common/AmazingButton';
import { CompareFloatingBar } from '../components/common/CompareFloatingBar';
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
  FileCheck2,
  Scale,
  Award,
  CheckCircle2,
  Landmark
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
      title: 'Farmer & Agriculture', 
      slug: 'farmer', 
      icon: Sprout, 
      desc: 'PM-KISAN installment credits, crop insurance, fertilizer aids & solar pump subsidies.',
      color: 'text-emerald-400',
      badge: 'Direct Benefit Transfer'
    },
    { 
      title: 'Students & Scholarships', 
      slug: 'student', 
      icon: GraduationCap, 
      desc: 'Central & State scholarships, National Scholarship Portal waivers & research stipends.',
      color: 'text-blue-400',
      badge: 'Education Grants'
    },
    { 
      title: 'Women & Child Welfare', 
      slug: 'women', 
      icon: HeartHandshake, 
      desc: 'Maternity assistance, Self-Help Group credits, Sukanya Samriddhi & health plans.',
      color: 'text-pink-400',
      badge: 'Empowerment Aid'
    },
    { 
      title: 'Startups & Business Loans', 
      slug: 'startup', 
      icon: Rocket, 
      desc: 'Mudra collateral-free credit, Startup India seed grants, patent rebates & incubators.',
      color: 'text-amber-400',
      badge: 'Seed Capital'
    },
    { 
      title: 'Youth & Skill Training', 
      slug: 'youth', 
      icon: Briefcase, 
      desc: 'Skill certification courses, apprenticeship allowances & employment registration.',
      color: 'text-indigo-400',
      badge: 'Apprenticeships'
    },
    { 
      title: 'MSME & Industry Credit', 
      slug: 'msme', 
      icon: Building2, 
      desc: 'Micro enterprise guarantees, machinery purchase subsidy & export promotion.',
      color: 'text-cyan-400',
      badge: 'Udyam Credit'
    },
  ];

  const popularSearches = [
    'PM-KISAN',
    'Scholarship',
    'Mudra Loan',
    'Matru Vandana',
    'Ayushman Bharat',
    'PM Awas'
  ];

  const faqs = [
    {
      q: "How does GovSchemeAI determine scheme eligibility?",
      a: "Our engine evaluates citizen demographic criteria (age, annual household income, gender, state residence, social category, land holding, and occupation) directly against official eligibility rule matrices published by central and state ministries."
    },
    {
      q: "Is GovSchemeAI an official government portal?",
      a: "GovSchemeAI is an independent citizen discovery platform. We index centralized and state government schemes from official gazettes and provide direct links to verified government domain portals (.gov.in / .nic.in) for online submission."
    },
    {
      q: "Is my personal data stored or shared?",
      a: "No. Your profile parameters are processed locally in your browser session for your discovery convenience. We do not sell or monetize citizen demographic data."
    },
    {
      q: "How often are scheme details verified and updated?",
      a: "Our system synchronizes with official ministry circulars, data.gov.in releases, and departmental notifications to ensure eligibility criteria, required documents, and application steps remain accurate."
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-start py-6 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24 overflow-hidden">
      
      {/* Compare Floating Tray */}
      <CompareFloatingBar />

      {/* HERO SECTION */}
      <section className="mx-auto max-w-7xl w-full flex flex-col lg:flex-row gap-10 lg:gap-14 items-center justify-between relative z-10 pt-2 sm:pt-6">
        
        {/* Left Hero Content */}
        <div className="flex-1 space-y-6 text-left animate-fade-in w-full">
          
          <div className="space-y-3.5">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 text-xs font-semibold text-blue-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="tracking-wider uppercase text-[10px] font-bold">
                National Public Welfare Directory • Verified Government Schemes
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.14] text-slate-100">
              Discover & Access Every Government Scheme You Qualify For
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              GovSchemeAI simplifies public welfare discovery. Check eligibility in 60 seconds across 130+ central and state ministry benefits with verified direct application links.
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
                placeholder="Search by scheme name, ministry, or benefit (e.g. PM-KISAN, Scholarship)..."
                className="w-full pl-11 pr-28 py-3.5 rounded-xl text-xs sm:text-sm bg-[#0E1422] border border-white/[0.1] text-slate-100 placeholder-slate-400 focus:border-blue-500 shadow-md"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Search
              </button>
            </div>
            
            {/* Popular Search Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Popular:</span>
              {popularSearches.map((term, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => router.push(`/schemes?search=${encodeURIComponent(term)}`)}
                  className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#0E1422] border border-white/[0.06] text-slate-400 hover:text-white hover:border-blue-500/40 transition-all cursor-pointer"
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
              variant="saffron"
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
            <div className="gov-card p-3 rounded-xl border border-white/[0.08] bg-[#0E1422]">
              <div className="font-heading text-xl sm:text-2xl font-black text-slate-100">
                {totalSchemes !== null ? totalSchemes : '130+'}
              </div>
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mt-0.5">Active Schemes</div>
            </div>

            <div className="gov-card p-3 rounded-xl border border-white/[0.08] bg-[#0E1422]">
              <div className="font-heading text-xl sm:text-2xl font-black text-blue-400">36</div>
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mt-0.5">States & UTs</div>
            </div>

            <div className="gov-card p-3 rounded-xl border border-white/[0.08] bg-[#0E1422]">
              <div className="font-heading text-xl sm:text-2xl font-black text-amber-400">50+</div>
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mt-0.5">Departments</div>
            </div>

            <div className="gov-card p-3 rounded-xl border border-white/[0.08] bg-[#0E1422]">
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
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-400">
              Categorized Citizen Portals
            </span>
            <h2 id="sector-hubs-title" className="font-heading text-2xl sm:text-3xl font-black text-slate-100 mt-1">
              Explore Dedicated Sector Hubs
            </h2>
          </div>
          <Link
            href="/hubs"
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Sector Portals</span>
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
                className="gov-card gov-card-hover p-6 rounded-2xl flex flex-col justify-between space-y-4 group cursor-pointer border border-white/[0.08] bg-[#111827]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-xl bg-[#0E1422] border border-white/[0.08] flex items-center justify-center group-hover:border-blue-500/40 transition-colors">
                      <Icon className={`h-5 w-5 ${hub.color}`} />
                    </div>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                      {hub.badge}
                    </span>
                  </div>

                  <h3 className="font-heading text-base font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                    {hub.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {hub.desc}
                  </p>
                </div>

                <div className="flex items-center text-xs font-bold text-blue-400 pt-2 border-t border-white/[0.04]">
                  <span>Explore Schemes</span>
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
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400">
                Verified Public Welfare Programs
              </span>
              <h2 id="featured-schemes-title" className="font-heading text-2xl sm:text-3xl font-black text-slate-100 mt-1">
                Featured Government Opportunities
              </h2>
            </div>
            <Link
              href="/schemes"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
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
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-400">
            Citizen Journey
          </span>
          <h2 id="process-title" className="font-heading text-2xl sm:text-3xl font-black text-slate-100">
            How GovSchemeAI Works
          </h2>
          <p className="text-xs text-slate-400">
            Four transparent stages connecting citizen profile criteria directly with official government welfare disbursement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="gov-card p-6 rounded-2xl border border-white/[0.08] space-y-3 relative bg-[#111827]">
            <span className="font-heading text-2xl font-black text-blue-500/30">01</span>
            <h3 className="font-heading text-sm font-bold text-slate-100">Profile Demographics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provide age, annual household income, state of residence, social category, and occupation.
            </p>
          </div>

          <div className="gov-card p-6 rounded-2xl border border-white/[0.08] space-y-3 relative bg-[#111827]">
            <span className="font-heading text-2xl font-black text-blue-500/30">02</span>
            <h3 className="font-heading text-sm font-bold text-slate-100">Criteria Evaluation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-criteria matching engine evaluates parameters against published ministry gazette rules.
            </p>
          </div>

          <div className="gov-card p-6 rounded-2xl border border-white/[0.08] space-y-3 relative bg-[#111827]">
            <span className="font-heading text-2xl font-black text-blue-500/30">03</span>
            <h3 className="font-heading text-sm font-bold text-slate-100">Benefit Breakdown</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Matching schemes are classified with financial estimations, criteria checks, and document checklists.
            </p>
          </div>

          <div className="gov-card p-6 rounded-2xl border border-white/[0.08] space-y-3 relative bg-[#111827]">
            <span className="font-heading text-2xl font-black text-blue-500/30">04</span>
            <h3 className="font-heading text-sm font-bold text-slate-100">Direct Application</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Apply directly on verified official government domain portals (.gov.in) with zero middleman fees.
            </p>
          </div>
        </div>
      </section>

      {/* TRUST & PRIVACY ASSURANCES */}
      <section className="mx-auto max-w-7xl w-full relative z-10">
        <div className="gov-card rounded-3xl p-6 sm:p-8 border border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0E1422]">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-slate-100">Data Privacy Preserved</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Profile parameters remain on your local device. We never sell, share, or monetize citizen demographic inputs.
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
                Every scheme links directly to verified government portals (.gov.in / .nic.in). No intermediary fees or redirection.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-slate-100">Continuous Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Eligibility matrices and application procedures are synchronized with official department notifications and circulars.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="mx-auto max-w-3xl w-full space-y-6 relative z-10" aria-labelledby="faq-title">
        <div className="text-center space-y-2">
          <h2 id="faq-title" className="font-heading text-2xl sm:text-3xl font-black text-slate-100 flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-amber-400" />
            <span>Frequently Asked Questions</span>
          </h2>
          <p className="text-xs text-slate-400">
            Clarifications regarding scheme eligibility matching and official portal submissions.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="gov-card rounded-xl overflow-hidden border border-white/[0.08] transition-all bg-[#111827]"
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
                  <div className="px-5 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/[0.06] bg-[#0E1422] animate-fade-in">
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
        <div className="gov-card rounded-3xl p-8 sm:p-12 border border-blue-500/25 text-center space-y-6 relative overflow-hidden bg-gradient-to-br from-[#111827] via-[#141E33] to-[#0E1422]">
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
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Check Eligibility Now</span>
            </a>
            <Link
              href="/chat"
              className="px-6 py-3 bg-[#0E1422] hover:bg-[#162035] border border-white/[0.08] text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <Bot className="h-4 w-4 text-blue-400" />
              <span>Ask Citizen Advisor AI</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
