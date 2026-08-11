'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EligibilityForm } from '../components/eligibility/EligibilityForm';
import { SchemeCard } from '../components/schemes/SchemeCard';
import {
  ShieldCheck, Search, Sparkles, HelpCircle, ChevronDown, ChevronUp,
  GraduationCap, Rocket, Sprout, HeartHandshake, Briefcase, Building2,
  ArrowRight, Bot
} from 'lucide-react';
import { api } from '../lib/api';
import { EligibleSchemeResult } from '../types/eligibility';
import Link from 'next/link';

export default function Home() {
  const { t } = useApp();
  const [totalSchemes, setTotalSchemes] = useState<number | null>(null);
  const [featuredSchemes, setFeaturedSchemes] = useState<EligibleSchemeResult[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    // Fetch statistics and featured schemes from backend
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

  const sectorHubs = [
    { 
      title: 'Student Hub', 
      slug: 'student', 
      icon: GraduationCap, 
      desc: 'National & State scholarships, fee waivers, education loans & research stipends.' 
    },
    { 
      title: 'Startup Hub', 
      slug: 'startup', 
      icon: Rocket, 
      desc: 'Mudra business loans, Startup India seed funding, patent fee rebates & incubators.' 
    },
    { 
      title: 'Farmer Hub', 
      slug: 'farmer', 
      icon: Sprout, 
      desc: 'PM-KISAN installment credits, crop insurance, fertilizer aid & solar pump subsidies.' 
    },
    { 
      title: 'Women Welfare', 
      slug: 'women', 
      icon: HeartHandshake, 
      desc: 'Maternity assistance, self-help group credits, girl child education & health plans.' 
    },
    { 
      title: 'Youth & Employment', 
      slug: 'youth', 
      icon: Briefcase, 
      desc: 'Skill development, apprenticeship allowances, employment registration benefits.' 
    },
    { 
      title: 'MSME & Business', 
      slug: 'msme', 
      icon: Building2, 
      desc: 'Micro enterprise collateral-free credit, machinery subsidy & export promotion.' 
    },
  ];

  const faqs = [
    {
      q: "How does GovSchemeAI determine scheme eligibility?",
      a: "Our engine executes direct rule validation logic matching your demographic parameters (age, income limit, gender, state residence, category, and occupation) against verified government criteria documents."
    },
    {
      q: "Is GovSchemeAI an official government portal?",
      a: "GovSchemeAI is an independent, citizen-focused discovery platform. We index centralized and state schemes and direct users directly to official portal links (.gov.in) for submission."
    },
    {
      q: "Is my personal information stored or sold?",
      a: "No. All profile inputs are processed temporarily and saved exclusively in your browser's local storage for your session convenience."
    },
    {
      q: "How often is scheme information updated?",
      a: "Our staging update architecture index updates daily, tracking new circulars, budget allocations, and deadline announcements from department sources."
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-start py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24 overflow-hidden">
      
      {/* HERO SECTION */}
      <section className="mx-auto max-w-7xl w-full flex flex-col lg:flex-row gap-12 items-center justify-between relative z-10 pt-4">
        
        {/* Left Hero Content */}
        <div className="flex-1 space-y-8 text-left animate-fade-in">
          
          <div className="space-y-5">
            {/* Verified Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-xs font-semibold text-[#A855F7]">
              <ShieldCheck className="h-4 w-4 text-[#22C55E]" />
              <span className="tracking-wider uppercase text-[10px] font-bold">GOVSCHEMEAI • VERIFIED GOVERNMENT SCHEME DATA</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-[#F5F5F7]">
              Find Government Schemes <br className="hidden sm:inline" />
              <span className="text-purple-gradient">You May Be Eligible For</span>
            </h1>

            {/* Supporting Subtitle */}
            <p className="text-sm sm:text-base text-[#A1A1AA] max-w-xl leading-relaxed">
              Discover scholarships, financial assistance, farmer benefits, startup support and welfare schemes tailored to your exact profile.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#eligibility-form"
              className="px-6 py-3.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-extrabold shadow-lg shadow-[#8B5CF6]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-purple-200" />
              Check My Eligibility
            </a>
            <Link
              href="/schemes"
              className="px-6 py-3.5 bg-[#101217] hover:bg-[#141720] border border-[#242832] text-[#F5F5F7] hover:text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-2"
            >
              <Search className="h-4 w-4 text-[#A1A1AA]" />
              Explore All Schemes
            </Link>
          </div>

          {/* Real Statistics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="gov-card p-3.5 rounded-xl border border-[#242832]">
              <div className="text-xl sm:text-2xl font-black text-[#F5F5F7]">
                {totalSchemes !== null ? totalSchemes : '130+'}
              </div>
              <div className="text-[10px] font-semibold uppercase text-[#71717A] tracking-wider mt-0.5">Active Schemes</div>
            </div>

            <div className="gov-card p-3.5 rounded-xl border border-[#242832]">
              <div className="text-xl sm:text-2xl font-black text-[#A855F7]">36</div>
              <div className="text-[10px] font-semibold uppercase text-[#71717A] tracking-wider mt-0.5">States & UTs</div>
            </div>

            <div className="gov-card p-3.5 rounded-xl border border-[#242832]">
              <div className="text-xl sm:text-2xl font-black text-[#06B6D4]">50+</div>
              <div className="text-[10px] font-semibold uppercase text-[#71717A] tracking-wider mt-0.5">Departments</div>
            </div>

            <div className="gov-card p-3.5 rounded-xl border border-[#242832]">
              <div className="text-xl sm:text-2xl font-black text-[#22C55E]">100%</div>
              <div className="text-[10px] font-semibold uppercase text-[#71717A] tracking-wider mt-0.5">Verified Sources</div>
            </div>
          </div>

        </div>

        {/* Right Hero Panel: Citizen Eligibility Card */}
        <div id="eligibility-form" className="w-full lg:max-w-lg animate-slide-up">
          <EligibilityForm />
        </div>
      </section>

      {/* SECTOR HUBS SECTION */}
      <section className="mx-auto max-w-7xl w-full space-y-8 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-[#242832] pb-4">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#A855F7]">Categorized Portals</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] mt-1">
              Explore Dedicated Sector Hubs
            </h2>
          </div>
          <Link
            href="/hubs"
            className="text-xs font-bold text-[#A855F7] hover:underline flex items-center gap-1"
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
                className="gov-card gov-card-hover p-6 rounded-2xl flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="h-11 w-11 rounded-xl bg-[#0D0F14] border border-[#242832] flex items-center justify-center group-hover:border-[#8B5CF6]/50 transition-colors">
                    <Icon className="h-5 w-5 text-[#A855F7]" />
                  </div>
                  <h3 className="text-base font-bold text-[#F5F5F7] group-hover:text-[#A855F7] transition-colors">
                    {hub.title}
                  </h3>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    {hub.desc}
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-[#A855F7] pt-2">
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
        <section className="mx-auto max-w-7xl w-full space-y-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-[#242832] pb-4">
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#06B6D4]">Indexed Database</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] mt-1">
                Featured Government Opportunities
              </h2>
            </div>
            <Link
              href="/schemes"
              className="text-xs font-bold text-[#A855F7] hover:underline flex items-center gap-1"
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

      {/* HOW IT WORKS PROCESS GRID */}
      <section className="mx-auto max-w-7xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#A855F7]">Structured Matching Process</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#F5F5F7]">
            How GovSchemeAI Works
          </h2>
          <p className="text-xs text-[#A1A1AA]">
            Four deterministic steps between citizen profile parameters and verified benefit disbursement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="gov-card p-6 rounded-2xl border border-[#242832] space-y-3 relative">
            <span className="text-2xl font-black text-[#8B5CF6]/30">01</span>
            <h3 className="text-sm font-bold text-[#F5F5F7]">Input Profile Details</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Enter age, annual income, occupation, category, state, and land parameters.
            </p>
          </div>

          <div className="gov-card p-6 rounded-2xl border border-[#242832] space-y-3 relative">
            <span className="text-2xl font-black text-[#8B5CF6]/30">02</span>
            <h3 className="text-sm font-bold text-[#F5F5F7]">Rules Engine Scanning</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Deterministic rule evaluation scans official ministry criteria matrices.
            </p>
          </div>

          <div className="gov-card p-6 rounded-2xl border border-[#242832] space-y-3 relative">
            <span className="text-2xl font-black text-[#8B5CF6]/30">03</span>
            <h3 className="text-sm font-bold text-[#F5F5F7]">Match Classification</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Schemes are split into Eligible, Potentially Eligible, and Not Eligible categories.
            </p>
          </div>

          <div className="gov-card p-6 rounded-2xl border border-[#242832] space-y-3 relative">
            <span className="text-2xl font-black text-[#8B5CF6]/30">04</span>
            <h3 className="text-sm font-bold text-[#F5F5F7]">Direct Portal Submission</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Follow step-by-step document guidelines and apply directly on verified government links.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="mx-auto max-w-3xl w-full space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-[#A855F7]" />
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-[#A1A1AA]">
            Common clarifications regarding verified scheme indexing and privacy assurances.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="gov-card rounded-xl overflow-hidden border border-[#242832] transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left flex justify-between items-center hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs sm:text-sm text-[#F5F5F7]">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-[#A1A1AA] shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#A1A1AA] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs text-[#A1A1AA] leading-relaxed border-t border-[#242832] bg-[#0D0F14] animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="mx-auto max-w-5xl w-full relative z-10 pt-4">
        <div className="gov-card rounded-3xl p-8 sm:p-12 border border-[#8B5CF6]/30 text-center space-y-6 relative overflow-hidden bg-gradient-to-br from-[#101217] via-[#141720] to-[#0D0F14]">
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black text-[#F5F5F7]">Ready to Find Your Eligible Benefits?</h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
              Run a quick 30-second eligibility check or consult our AI Scheme Advisor for document assistance.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <a
              href="#eligibility-form"
              className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Check Eligibility Now
            </a>
            <Link
              href="/chat"
              className="px-6 py-3 bg-[#0D0F14] hover:bg-[#101217] border border-[#242832] text-[#F5F5F7] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <Bot className="h-4 w-4 text-[#A855F7]" />
              Ask Citizen Advisor AI
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
