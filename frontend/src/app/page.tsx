'use client';

import React, { useState, useEffect } from 'react';
import { EligibilityForm } from '../components/eligibility/EligibilityForm';
import { SchemeCard } from '../components/schemes/SchemeCard';
import { AmazingButton } from '../components/common/AmazingButton';
import { CompareFloatingBar } from '../components/common/CompareFloatingBar';
import { NetworkBackground } from '../components/common/NetworkBackground';
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
  CheckCircle2,
  FileText,
  Clock,
  Compass
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
      color: 'text-[#176B52]',
      bg: 'bg-[#E7F3EC]',
      border: 'border-[#176B52]/20',
      badge: 'Direct Benefit Transfer'
    },
    { 
      title: 'Students & Scholarships', 
      slug: 'student', 
      icon: GraduationCap, 
      desc: 'Central & State scholarships, National Scholarship Portal waivers & research stipends.',
      color: 'text-[#176B52]',
      bg: 'bg-[#EBF2EB]',
      border: 'border-[#DDE9DF]',
      badge: 'Education Grants'
    },
    { 
      title: 'Women & Child Welfare', 
      slug: 'women', 
      icon: HeartHandshake, 
      desc: 'Maternity assistance, Self-Help Group credits, Sukanya Samriddhi & health plans.',
      color: 'text-[#E8A126]',
      bg: 'bg-[#FAF5E9]',
      border: 'border-[#F3E7CA]',
      badge: 'Empowerment Aid'
    },
    { 
      title: 'Startups & Business Loans', 
      slug: 'startup', 
      icon: Rocket, 
      desc: 'Mudra collateral-free credit, Startup India seed grants, patent rebates & incubators.',
      color: 'text-[#176B52]',
      bg: 'bg-[#E7F3EC]',
      border: 'border-[#176B52]/20',
      badge: 'Seed Capital'
    },
    { 
      title: 'Youth & Skill Training', 
      slug: 'youth', 
      icon: Briefcase, 
      desc: 'Skill certification courses, apprenticeship allowances & employment registration.',
      color: 'text-[#202820]',
      bg: 'bg-[#F7F8F5]',
      border: 'border-[#E5E9E3]',
      badge: 'Apprenticeships'
    },
    { 
      title: 'MSME & Industry Credit', 
      slug: 'msme', 
      icon: Building2, 
      desc: 'Micro enterprise guarantees, machinery purchase subsidy & export promotion.',
      color: 'text-[#176B52]',
      bg: 'bg-[#EBF5F0]',
      border: 'border-[#DDE9DF]',
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
    <div className="relative min-h-screen flex flex-col justify-start py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24 bg-[#F7F8F5]">
      
      {/* Compare Floating Tray */}
      <CompareFloatingBar />

      {/* HERO SECTION CONTAINER WITH EXACT REFERENCE NETWORK ANIMATION */}
      <section className="relative mx-auto max-w-7xl w-full rounded-3xl border border-[#CDEAEB] shadow-sm bg-[#DFF3F5] overflow-hidden">
        {/* Exact Reference Pale-Cyan Network Animation Canvas */}
        <NetworkBackground className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Foreground Content with High-Legibility Contrast & Full Interactivity */}
        <div className="relative z-10 flex flex-col lg:flex-row gap-12 lg:gap-16 items-center justify-between px-6 sm:px-10 lg:px-12 py-8 sm:py-12 lg:py-14">
          
          {/* Left Hero Content */}
          <div className="flex-1 space-y-6 text-left animate-fade-in w-full">
            
            <div className="space-y-4">
              {/* Trust Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#176B52]/25 bg-white/80 backdrop-blur-xs text-xs font-semibold text-[#176B52] shadow-2xs">
                <ShieldCheck className="h-4 w-4" />
                <span className="tracking-wide text-xs font-medium">
                  Official Directory • 130+ Verified Public Welfare Programs
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.12] text-[#1A2E28]">
                Government Benefits, <br className="hidden sm:inline" />
                <span className="text-[#176B52]">Made Easier to Access.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-[#3E524A] max-w-xl leading-relaxed">
                Discover public welfare programs tailored to your family. Check eligibility in under 60 seconds with transparent criteria and direct official application portals.
              </p>
            </div>

            {/* Quick Search Bar */}
            <form onSubmit={handleHeroSearchSubmit} className="max-w-xl relative">
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-4 w-4 text-[#738A84] pointer-events-none" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Search by scheme name, ministry, or benefit..."
                  className="w-full pl-11 pr-28 py-3.5 rounded-2xl text-xs sm:text-sm bg-white/95 backdrop-blur-xs border border-[#C6E4E7] text-[#202820] placeholder-[#738A84] focus:border-[#176B52] focus:bg-white focus:outline-none shadow-xs transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-4 py-2 bg-[#176B52] hover:bg-[#124C3D] text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  Search
                </button>
              </div>
              
              {/* Popular Search Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-3">
                <span className="text-xs font-medium text-[#4F635C]">Popular:</span>
                {popularSearches.map((term, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => router.push(`/schemes?search=${encodeURIComponent(term)}`)}
                    className="text-xs px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-[#CBE7EA] text-[#334640] hover:text-[#176B52] hover:border-[#176B52]/50 transition-all cursor-pointer shadow-2xs"
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
                variant="primary"
                size="lg"
                icon={<Sparkles className="h-4 w-4 text-[#E8A126]" />}
                iconPosition="left"
              >
                Check My Eligibility
              </AmazingButton>
              <AmazingButton
                href="/schemes"
                variant="secondary"
                size="lg"
                icon={<Layers className="h-4 w-4 text-[#687368]" />}
                iconPosition="left"
              >
                Explore All Schemes
              </AmazingButton>
            </div>

            {/* Live Verified Platform Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 max-w-2xl">
              <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-[#CBE7EA] shadow-xs">
                <div className="font-heading text-xl sm:text-2xl font-bold text-[#1A2E28]">
                  {totalSchemes !== null ? totalSchemes : '130+'}
                </div>
                <div className="text-xs text-[#526B63] mt-0.5">Active Schemes</div>
              </div>

              <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-[#CBE7EA] shadow-xs">
                <div className="font-heading text-xl sm:text-2xl font-bold text-[#176B52]">36</div>
                <div className="text-xs text-[#526B63] mt-0.5">States & UTs</div>
              </div>

              <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-[#CBE7EA] shadow-xs">
                <div className="font-heading text-xl sm:text-2xl font-bold text-[#D08B15]">50+</div>
                <div className="text-xs text-[#526B63] mt-0.5">Departments</div>
              </div>

              <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-[#CBE7EA] shadow-xs">
                <div className="font-heading text-xl sm:text-2xl font-bold text-[#176B52]">100%</div>
                <div className="text-xs text-[#526B63] mt-0.5">Direct Sources</div>
              </div>
            </div>

          </div>

          {/* Right Hero Panel: Citizen Eligibility Quick-Scan Form */}
          <div id="eligibility-form" className="w-full lg:max-w-md animate-slide-up shrink-0 shadow-sm rounded-3xl">
            <EligibilityForm />
          </div>

        </div>
      </section>

      {/* 3 PASTEL CITIZEN PILLARS (Inspired by Reference Image 1) */}
      <section className="mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Prepare */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#E7F3EC] border border-[#176B52]/20 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xl font-bold text-[#124C3D]">Prepare</h3>
                <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center text-[#176B52] shadow-xs">
                  <Compass className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-[#202820]/75 leading-relaxed">
                Understand rules and documents before applying for welfare programs.
              </p>
              <ul className="space-y-2 text-xs font-medium text-[#124C3D] pt-1">
                <li>
                  <Link href="/eligibility" className="hover:underline flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#176B52]" />
                    <span>Check eligibility for benefits</span>
                  </Link>
                </li>
                <li>
                  <Link href="/compare" className="hover:underline flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#176B52]" />
                    <span>Compare benefits & requirements</span>
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="hover:underline flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#176B52]" />
                    <span>Ask AI advisor for guidelines</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 2: Apply */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#EBF2EB] border border-[#DDE9DF] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xl font-bold text-[#202820]">Apply</h3>
                <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center text-[#202820] shadow-xs">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-[#687368] leading-relaxed">
                Connect directly to official centralized and state submission portals.
              </p>
              <ul className="space-y-2 text-xs font-medium text-[#202820] pt-1">
                <li>
                  <Link href="/schemes" className="hover:underline flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#176B52]" />
                    <span>Apply for central & state schemes</span>
                  </Link>
                </li>
                <li>
                  <Link href="/hubs" className="hover:underline flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#176B52]" />
                    <span>Register on sector welfare hubs</span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:underline flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#176B52]" />
                    <span>Review your saved applications</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 3: After you apply */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#FAF5E9] border border-[#F3E7CA] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xl font-bold text-[#8C6212]">After you apply</h3>
                <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center text-[#E8A126] shadow-xs">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-[#687368] leading-relaxed">
                Verify installment statuses, grievance procedures, and helpline support.
              </p>
              <ul className="space-y-2 text-xs font-medium text-[#8C6212] pt-1">
                <li>
                  <a href="https://pmkisan.gov.in" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#E8A126]" />
                    <span>Check DBT & installment status</span>
                  </a>
                </li>
                <li>
                  <a href="https://scholarships.gov.in" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#E8A126]" />
                    <span>Track scholarship verification</span>
                  </a>
                </li>
                <li>
                  <Link href="/chat?q=How%20do%20I%20file%20a%20grievance%20for%20a%20rejected%20scheme%20application" className="hover:underline flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#E8A126]" />
                    <span>Appeal or file a citizen grievance</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* SECTOR HUBS SECTION */}
      <section className="mx-auto max-w-7xl w-full space-y-6 relative z-10" aria-labelledby="sector-hubs-title">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-[#E5E9E3] pb-4">
          <div>
            <span className="text-xs font-semibold text-[#176B52] uppercase tracking-wider">
              Categorized Citizen Portals
            </span>
            <h2 id="sector-hubs-title" className="font-heading text-2xl sm:text-3xl font-bold text-[#202820] mt-1">
              Explore Dedicated Sector Hubs
            </h2>
          </div>
          <Link
            href="/hubs"
            className="text-xs font-semibold text-[#176B52] hover:text-[#124C3D] flex items-center gap-1 transition-colors"
          >
            <span>View All Sector Portals</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectorHubs.map((hub) => {
            const Icon = hub.icon;
            return (
              <Link
                key={hub.slug}
                href={`/hubs/${hub.slug}`}
                className="bg-white p-6 rounded-2xl flex flex-col justify-between space-y-4 group cursor-pointer border border-[#E5E9E3] hover:border-[#176B52]/40 shadow-xs hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`h-11 w-11 rounded-2xl ${hub.bg} border ${hub.border} flex items-center justify-center transition-colors`}>
                      <Icon className={`h-5 w-5 ${hub.color}`} />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F7F8F5] text-[#687368] border border-[#E5E9E3]">
                      {hub.badge}
                    </span>
                  </div>

                  <h3 className="font-heading text-base font-bold text-[#202820] group-hover:text-[#176B52] transition-colors">
                    {hub.title}
                  </h3>
                  <p className="text-xs text-[#687368] leading-relaxed">
                    {hub.desc}
                  </p>
                </div>

                <div className="flex items-center text-xs font-semibold text-[#176B52] pt-3 border-t border-[#E5E9E3]">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-[#E5E9E3] pb-4">
            <div>
              <span className="text-xs font-semibold text-[#176B52] uppercase tracking-wider">
                Verified Public Welfare Programs
              </span>
              <h2 id="featured-schemes-title" className="font-heading text-2xl sm:text-3xl font-bold text-[#202820] mt-1">
                Featured Government Opportunities
              </h2>
            </div>
            <Link
              href="/schemes"
              className="text-xs font-semibold text-[#176B52] hover:text-[#124C3D] flex items-center gap-1 transition-colors"
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
          <span className="text-xs font-semibold text-[#E8A126] uppercase tracking-wider">
            Citizen Journey
          </span>
          <h2 id="process-title" className="font-heading text-2xl sm:text-3xl font-bold text-[#202820]">
            How GovSchemeAI Works
          </h2>
          <p className="text-xs text-[#687368]">
            Four transparent stages connecting citizen profile criteria directly with official government welfare disbursement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E9E3] space-y-3 relative shadow-xs">
            <span className="font-heading text-2xl font-bold text-[#176B52]/30">01</span>
            <h3 className="font-heading text-sm font-bold text-[#202820]">Profile Demographics</h3>
            <p className="text-xs text-[#687368] leading-relaxed">
              Provide age, annual household income, state of residence, social category, and occupation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E9E3] space-y-3 relative shadow-xs">
            <span className="font-heading text-2xl font-bold text-[#176B52]/30">02</span>
            <h3 className="font-heading text-sm font-bold text-[#202820]">Criteria Evaluation</h3>
            <p className="text-xs text-[#687368] leading-relaxed">
              Multi-criteria matching engine evaluates parameters against published ministry gazette rules.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E9E3] space-y-3 relative shadow-xs">
            <span className="font-heading text-2xl font-bold text-[#176B52]/30">03</span>
            <h3 className="font-heading text-sm font-bold text-[#202820]">Benefit Breakdown</h3>
            <p className="text-xs text-[#687368] leading-relaxed">
              Matching schemes are classified with financial estimations, criteria checks, and document checklists.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E9E3] space-y-3 relative shadow-xs">
            <span className="font-heading text-2xl font-bold text-[#176B52]/30">04</span>
            <h3 className="font-heading text-sm font-bold text-[#202820]">Direct Application</h3>
            <p className="text-xs text-[#687368] leading-relaxed">
              Apply directly on verified official government domain portals (.gov.in) with zero middleman fees.
            </p>
          </div>
        </div>
      </section>

      {/* TRUST & PRIVACY ASSURANCES */}
      <section className="mx-auto max-w-7xl w-full relative z-10">
        <div className="rounded-3xl p-6 sm:p-8 border border-[#E5E9E3] grid grid-cols-1 md:grid-cols-3 gap-6 bg-white shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-[#E7F3EC] border border-[#176B52]/20 flex items-center justify-center text-[#176B52] shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-[#202820]">Data Privacy Preserved</h3>
              <p className="text-xs text-[#687368] leading-relaxed">
                Profile parameters remain on your local device. We never sell, share, or monetize citizen demographic inputs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-[#E7F3EC] border border-[#176B52]/20 flex items-center justify-center text-[#176B52] shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-[#202820]">Direct Official Links</h3>
              <p className="text-xs text-[#687368] leading-relaxed">
                Every scheme links directly to verified government portals (.gov.in / .nic.in). No intermediary fees or redirection.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-[#FAF5E9] border border-[#F3E7CA] flex items-center justify-center text-[#E8A126] shrink-0">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-[#202820]">Continuous Verification</h3>
              <p className="text-xs text-[#687368] leading-relaxed">
                Eligibility matrices and application procedures are synchronized with official department notifications and circulars.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="mx-auto max-w-3xl w-full space-y-6 relative z-10" aria-labelledby="faq-title">
        <div className="text-center space-y-2">
          <h2 id="faq-title" className="font-heading text-2xl sm:text-3xl font-bold text-[#202820] flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-[#176B52]" />
            <span>Frequently Asked Questions</span>
          </h2>
          <p className="text-xs text-[#687368]">
            Clarifications regarding scheme eligibility matching and official portal submissions.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden border border-[#E5E9E3] shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left flex justify-between items-center hover:bg-[#F7F8F5] transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-xs sm:text-sm text-[#202820]">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-[#687368] shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#687368] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs text-[#687368] leading-relaxed border-t border-[#E5E9E3] bg-[#F7F8F5] animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="mx-auto max-w-5xl w-full relative z-10 pt-2 pb-4">
        <div className="rounded-3xl p-8 sm:p-12 border border-[#176B52]/20 text-center space-y-6 relative overflow-hidden bg-[#E7F3EC]">
          <div className="space-y-2 relative z-10">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#124C3D]">
              Ready to Discover Your Eligible Benefits?
            </h2>
            <p className="text-xs sm:text-sm text-[#4F594F] max-w-md mx-auto leading-relaxed">
              Run a quick 60-second eligibility check or consult our AI Scheme Advisor for document assistance.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3.5 relative z-10">
            <a
              href="#eligibility-form"
              className="px-6 py-3 bg-[#176B52] hover:bg-[#124C3D] text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-[#E8A126]" />
              <span>Check Eligibility Now</span>
            </a>
            <Link
              href="/chat"
              className="px-6 py-3 bg-white hover:bg-[#F7F8F5] border border-[#E5E9E3] text-[#202820] rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Bot className="h-4 w-4 text-[#176B52]" />
              <span>Ask Citizen Advisor AI</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
