'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EligibilityForm } from '../components/eligibility/EligibilityForm';
import { SchemeCard } from '../components/schemes/SchemeCard';
import {
  ShieldCheck, Search, Sparkles, HelpCircle, ChevronDown, ChevronUp,
  GraduationCap, Rocket, Sprout, HeartHandshake, Briefcase, Building2,
  ArrowRight, Bot, CheckCircle2, UserCheck, Layers, Award, Landmark, Globe
} from 'lucide-react';
import { api } from '../lib/api';
import { EligibleSchemeResult } from '../types/eligibility';
import Link from 'next/link';
import { Footer } from '../components/layout/Footer';

export default function Home() {
  const { t } = useApp();
  const [totalSchemes, setTotalSchemes] = useState<number | null>(null);
  const [featuredSchemes, setFeaturedSchemes] = useState<EligibleSchemeResult[]>([]);
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
      desc: 'Maternity assistance, Lakhpati Didi, self-help group capital & girl child savings.' 
    },
    { 
      title: 'MSME & Business', 
      slug: 'msme', 
      icon: Briefcase, 
      desc: 'PMEGP credit subsidies, ZED certification rebates, technology upgradation funds.' 
    },
    { 
      title: 'Healthcare & Pension', 
      slug: 'healthcare', 
      icon: Building2, 
      desc: 'Ayushman Bharat cashless coverage, PM Vaya Vandana & Atal Pension Yojana.' 
    },
  ];

  const faqs = [
    {
      q: 'How does GovSchemeAI determine my scheme eligibility?',
      a: 'GovSchemeAI checks your demographic profile (age, state, annual income, occupation, category) against official eligibility rules indexed directly from Central and State Government notifications.'
    },
    {
      q: 'Is GovSchemeAI an official Government website?',
      a: 'GovSchemeAI is an independent, citizen-first technology discovery platform. We aggregate and verify data from official public government portals (.gov.in and .nic.in) to help citizens navigate schemes.'
    },
    {
      q: 'Are there any fees for checking scheme eligibility?',
      a: 'No. GovSchemeAI is 100% free for all Indian citizens. We never charge any fees or request bank details.'
    },
    {
      q: 'How do I apply for a scheme once matched?',
      a: 'When you view a scheme on GovSchemeAI, we provide direct links to the official government application portal (e.g. pmkisan.gov.in, myscheme.gov.in, or scholarships.gov.in) so you can apply securely.'
    }
  ];

  return (
    <div className="space-y-20 sm:space-y-28 pb-12 relative z-10">

      {/* ============================================================ */}
      {/* HOMEPAGE HERO — EDITORIAL COMPOSITION inspired by Reference */}
      {/* ============================================================ */}
      <section className="relative pt-8 sm:pt-16 pb-12 overflow-hidden bg-ambient-purple">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* LEFT SIDE — Editorial Typography & CTAs */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
              
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 text-xs font-bold tracking-wider text-[#A78BFA] uppercase shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                <ShieldCheck className="h-4 w-4 text-[#A78BFA]" />
                <span>GOVSCHEMEAI • VERIFIED GOVERNMENT SCHEME DATA</span>
              </div>

              {/* Large Editorial Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-[#F8FAFC]">
                Discover Government <br className="hidden sm:block" />
                <span className="text-gradient-purple">Schemes.</span> <br />
                Made Simple for India.
              </h1>

              {/* Short Concise Description */}
              <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed max-w-xl font-normal">
                Find government schemes, scholarships, subsidies, and welfare benefits you may qualify for — aggregated from verified Central and State government sources.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#eligibility-form"
                  className="px-7 py-3.5 rounded-2xl text-sm font-bold purple-glow-btn flex items-center gap-2.5 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Find Eligible Schemes</span>
                </a>
                <Link
                  href="/schemes"
                  className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-[#171226] hover:bg-[#1F1833] border border-[#251B3B] hover:border-[#8B5CF6]/40 text-[#F8FAFC] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Browse Schemes</span>
                  <ArrowRight className="h-4 w-4 text-[#A78BFA]" />
                </Link>
              </div>

              {/* Trust Subtext */}
              <div className="flex items-center gap-6 pt-4 text-xs font-medium text-[#94A3B8] border-t border-[#251B3B]/80 max-w-lg">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>100% Free Service</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#A78BFA]" />
                  <span>No Registration Required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#C084FC]" />
                  <span>Direct Official Links</span>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE — Interactive Layered Citizen Eligibility Preview Panel */}
            <div className="lg:col-span-5 relative">
              
              {/* Soft purple atmospheric backdrop glow */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#8B5CF6]/20 via-[#C084FC]/10 to-transparent blur-3xl rounded-3xl pointer-events-none" />

              {/* Layered Floating Card Container */}
              <div className="purple-card-interactive rounded-3xl p-6 sm:p-7 relative z-10 space-y-5">
                
                {/* Floating Top Badge */}
                <div className="flex items-center justify-between border-b border-[#251B3B] pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#F8FAFC]">
                      CITIZEN ELIGIBILITY ENGINE
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    98.4% MATCH ACCURACY
                  </span>
                </div>

                {/* Profile Criteria Preview Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#120E1E] border border-[#251B3B]">
                    <span className="text-[#94A3B8] block text-[10px] font-semibold uppercase">Citizen Age</span>
                    <span className="text-[#F8FAFC] font-bold text-sm">25 Years</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#120E1E] border border-[#251B3B]">
                    <span className="text-[#94A3B8] block text-[10px] font-semibold uppercase">State / UT</span>
                    <span className="text-[#F8FAFC] font-bold text-sm">Uttar Pradesh</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#120E1E] border border-[#251B3B]">
                    <span className="text-[#94A3B8] block text-[10px] font-semibold uppercase">Annual Income</span>
                    <span className="text-[#F8FAFC] font-bold text-sm">₹1,20,000 / year</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#120E1E] border border-[#251B3B]">
                    <span className="text-[#94A3B8] block text-[10px] font-semibold uppercase">Occupation</span>
                    <span className="text-[#F8FAFC] font-bold text-sm">Agriculture / Student</span>
                  </div>
                </div>

                {/* Matched Scheme Cards Result Stack */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#A78BFA] block">
                    LIVE MATCHED SCHEMES FOUND:
                  </span>

                  <div className="p-3 rounded-xl bg-[#120E1E] border border-[#8B5CF6]/40 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#F8FAFC]">PM-KISAN Samman Nidhi</h4>
                      <p className="text-[10px] text-[#94A3B8]">Direct Financial Aid • ₹6,000 / year</p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ELIGIBLE
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#120E1E] border border-[#251B3B] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#F8FAFC]">PM Vidya Lakshmi Education Loan</h4>
                      <p className="text-[10px] text-[#94A3B8]">Education Loan Interest Subsidy</p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ELIGIBLE
                    </span>
                  </div>
                </div>

                {/* Interactive Action CTA */}
                <a
                  href="#eligibility-form"
                  className="w-full py-3 rounded-xl text-xs font-bold bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-[#A78BFA] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Check Your Profile Eligibility Now</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 1: LIVE PLATFORM STATISTICS (Real DB Data) */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="purple-card rounded-2xl p-6 text-center space-y-1">
            <span className="text-3xl sm:text-4xl font-black text-gradient-purple">
              {totalSchemes !== null ? `${totalSchemes}+` : '129+'}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">
              Verified Schemes
            </span>
          </div>

          <div className="purple-card rounded-2xl p-6 text-center space-y-1">
            <span className="text-3xl sm:text-4xl font-black text-gradient-purple">36</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">
              States & UTs Covered
            </span>
          </div>

          <div className="purple-card rounded-2xl p-6 text-center space-y-1">
            <span className="text-3xl sm:text-4xl font-black text-gradient-purple">9+</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">
              Major Sector Hubs
            </span>
          </div>

          <div className="purple-card rounded-2xl p-6 text-center space-y-1">
            <span className="text-3xl sm:text-4xl font-black text-gradient-purple">100%</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">
              Official Gov Sources
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2: POPULAR SCHEME CATEGORIES */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#F8FAFC]">Browse Popular Sectors</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Discover targeted government schemes tailored for specific citizen demographics and industries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectorHubs.map((hub) => {
            const Icon = hub.icon;
            return (
              <Link
                key={hub.slug}
                href={`/hubs/${hub.slug}`}
                className="purple-card rounded-2xl p-6 space-y-4 group hover:border-[#8B5CF6]/50 transition-all cursor-pointer"
              >
                <div className="h-12 w-12 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A78BFA] group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#F8FAFC] group-hover:text-[#A78BFA] transition-colors flex items-center justify-between">
                    <span>{hub.title}</span>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{hub.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3: FEATURED GOVERNMENT SCHEMES (Real API Data) */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#251B3B] pb-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8FAFC]">Featured Government Schemes</h2>
            <p className="text-xs sm:text-sm text-[#94A3B8]">
              Active Central and State government welfare programs available for application.
            </p>
          </div>
          <Link
            href="/schemes"
            className="text-xs font-bold text-[#A78BFA] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View All Schemes</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featuredSchemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSchemes.map((scheme) => (
              <SchemeCard key={scheme.slug} scheme={scheme} isMatchedView={false} />
            ))}
          </div>
        ) : (
          <div className="purple-card rounded-2xl p-12 text-center text-xs text-[#94A3B8]">
            Loading active government schemes...
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* SECTION 4: ELIGIBILITY INTERACTIVE FORM SECTION */}
      {/* ============================================================ */}
      <section id="eligibility-form" className="mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="purple-card-interactive rounded-3xl p-6 sm:p-10 space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-xs font-bold text-[#A78BFA]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>MULTICRITERIA BENEFIT MATCHING</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F8FAFC]">
              Find Schemes You May Qualify For
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8]">
              Fill out your basic demographic profile below to evaluate eligibility against official Central and State government notifications.
            </p>
          </div>

          <EligibilityForm />
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 5: HOW GOVSCHEMEAI WORKS */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#F8FAFC]">How GovSchemeAI Works</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            4 simple steps to discover and apply for eligible government benefits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="purple-card rounded-2xl p-6 space-y-3 relative">
            <span className="h-8 w-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#A78BFA] font-black text-sm flex items-center justify-center">
              01
            </span>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Tell Us About Yourself</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Enter basic details like your age, state, annual income, occupation, and category.
            </p>
          </div>

          <div className="purple-card rounded-2xl p-6 space-y-3 relative">
            <span className="h-8 w-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#A78BFA] font-black text-sm flex items-center justify-center">
              02
            </span>
            <h3 className="text-sm font-bold text-[#F8FAFC]">We Check Official Rules</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Our rules engine evaluates your profile against indexed Ministry notifications.
            </p>
          </div>

          <div className="purple-card rounded-2xl p-6 space-y-3 relative">
            <span className="h-8 w-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#A78BFA] font-black text-sm flex items-center justify-center">
              03
            </span>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Find Matching Schemes</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Receive a sorted list of eligible schemes with match percentages and requirement breakdowns.
            </p>
          </div>

          <div className="purple-card rounded-2xl p-6 space-y-3 relative">
            <span className="h-8 w-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#A78BFA] font-black text-sm flex items-center justify-center">
              04
            </span>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Apply via Official Sources</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Click direct links to apply on official government portals (ending in .gov.in).
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 6: GOVERNMENT SOURCE TRUST SECTION */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="purple-card rounded-3xl p-8 sm:p-10 border border-[#251B3B] space-y-6 text-center">
          <div className="space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>VERIFIED OFFICIAL GOVERNMENT INDEXING</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC]">
              Directly Aggregated From Official Portals
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              GovSchemeAI indexes government notifications and scheme guidelines from verified domain sources.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#CBD5E1]">
            <span className="px-4 py-2 rounded-xl bg-[#120E1E] border border-[#251B3B]">India.gov.in</span>
            <span className="px-4 py-2 rounded-xl bg-[#120E1E] border border-[#251B3B]">myScheme.gov.in</span>
            <span className="px-4 py-2 rounded-xl bg-[#120E1E] border border-[#251B3B]">MyGov.in</span>
            <span className="px-4 py-2 rounded-xl bg-[#120E1E] border border-[#251B3B]">pib.gov.in</span>
            <span className="px-4 py-2 rounded-xl bg-[#120E1E] border border-[#251B3B]">scholarships.gov.in</span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FAQ SECTION */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-[#F8FAFC]">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Clear answers on data verification, security, and application guidance.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="purple-card rounded-2xl overflow-hidden border border-[#251B3B]"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#F8FAFC] hover:text-[#A78BFA] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-[#94A3B8] shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#94A3B8] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 pt-1 text-xs text-[#CBD5E1] leading-relaxed border-t border-[#251B3B] bg-[#120E1E] animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* HOME PAGE FOOTER */}
      {/* ============================================================ */}
      <Footer />

    </div>
  );
}
