'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EligibilityForm } from '../components/eligibility/EligibilityForm';
import { SchemeCard } from '../components/schemes/SchemeCard';
import { COMPREHENSIVE_SCHEMES } from '../data/comprehensiveSchemes';
import Link from 'next/link';
import {
  ShieldCheck, Search, GraduationCap, Rocket, Tractor, HeartHandshake,
  Briefcase, Landmark, ArrowRight, CheckCircle2, FileCheck, Layers, MapPin,
  Building2, ExternalLink, HelpCircle, ChevronDown, ChevronUp, Bell, Sparkles, BookOpen
} from 'lucide-react';

export default function HomePage() {
  const { language, t } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const studentSchemes = COMPREHENSIVE_SCHEMES.filter(s => s.hub_category === 'student');
  const startupSchemes = COMPREHENSIVE_SCHEMES.filter(s => s.hub_category === 'startup');
  const farmerSchemes = COMPREHENSIVE_SCHEMES.filter(s => s.hub_category === 'farmer');
  const womenSchemes = COMPREHENSIVE_SCHEMES.filter(s => s.hub_category === 'women');

  const faqs = [
    {
      q: "How does GovSchemeAI determine scheme eligibility?",
      a: "GovSchemeAI evaluates citizen profile parameters (age, state, annual income, social category, and occupation) directly against official gazettes published by Central & State Ministries."
    },
    {
      q: "Is my personal data saved or stored on any server?",
      a: "No. Your profile questionnaire is processed locally within your session. GovSchemeAI prioritizes citizen privacy and data security."
    },
    {
      q: "Are the scheme application links official?",
      a: "Yes, 100% of external links route directly to official government portals such as NSP (scholarships.gov.in), PM-KISAN (pmkisan.gov.in), and Startup India (startupindia.gov.in)."
    },
    {
      q: "Can I check eligibility for state-specific schemes?",
      a: "Yes! GovSchemeAI indexes welfare programs across all 36 States and Union Territories of India."
    }
  ];

  return (
    <div className="space-y-16 pb-16 bg-slate-50 text-slate-900 animate-fade-in">
      {/* 1. HERO BANNER */}
      <section className="bg-white border-b border-slate-200 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-extrabold text-blue-800 uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>National Citizen Services Portal • Digital India Initiative</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Discover Government Welfare Schemes <span className="text-blue-600">You Qualify For</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl">
              Access verified Central and State welfare programs. Evaluate rule eligibility, check required documents, and apply directly on official government portals.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#eligibility-wizard"
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <span>Check Scheme Eligibility</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <Link
                href="/schemes"
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs sm:text-sm transition-all border border-slate-200 flex items-center gap-2 cursor-pointer"
              >
                <Search className="h-4 w-4 text-slate-600" />
                <span>Browse All Schemes</span>
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 max-w-lg text-xs">
              <div>
                <div className="font-black text-slate-900 text-base">500+</div>
                <div className="text-slate-500 text-[11px]">Indexed Schemes</div>
              </div>
              <div>
                <div className="font-black text-blue-600 text-base">36</div>
                <div className="text-slate-500 text-[11px]">States & UTs</div>
              </div>
              <div>
                <div className="font-black text-emerald-600 text-base">100%</div>
                <div className="text-slate-500 text-[11px]">Verified Portals</div>
              </div>
            </div>
          </div>

          {/* Right Eligibility Assessment Card */}
          <div className="lg:col-span-5">
            <div className="gov-card rounded-3xl p-6 sm:p-7 bg-white border border-slate-200 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Instant Scheme Evaluator</div>
                    <div className="text-[10px] text-slate-500">Department Criteria Evaluation</div>
                  </div>
                </div>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Engine
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Evaluates Age, Annual Income, Category & State</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Displays Match % & Rule Breakdown</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Lists Direct Document Checklists</span>
                </div>
              </div>

              <a
                href="#eligibility-wizard"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <span>Start 3-Step Wizard Below</span>
                <ArrowRight className="h-4 w-4 text-blue-400" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK ELIGIBILITY FORM WIZARD */}
      <section id="eligibility-wizard" className="mx-auto max-w-4xl px-4 sm:px-6 scroll-mt-24">
        <EligibilityForm />
      </section>

      {/* 3. POPULAR SCHEMES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              Popular National Schemes
            </h2>
            <p className="text-xs text-slate-500">Top welfare programs accessed by citizens across India</p>
          </div>
          <Link href="/schemes" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
            <span>View All Schemes</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMPREHENSIVE_SCHEMES.slice(0, 6).map((sch) => (
            <SchemeCard key={sch.id} scheme={{ ...sch, match_score: 1.0, rules_matched: 0, rules_total: 0 } as any} isMatchedView={false} />
          ))}
        </div>
      </section>

      {/* 4. BROWSE CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Browse Schemes by Sector</h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">Explore targeted welfare programs tailored to your specific field and category.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { title: "Student Hub", icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", href: "/hubs/student" },
            { title: "Startup Hub", icon: Rocket, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", href: "/hubs/startup" },
            { title: "Farmer Hub", icon: Tractor, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", href: "/hubs/farmer" },
            { title: "Women Hub", icon: HeartHandshake, color: "text-pink-600", bg: "bg-pink-50 border-pink-200", href: "/hubs/women" },
            { title: "Youth Hub", icon: Briefcase, color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-200", href: "/hubs/youth" },
          ].map((cat, idx) => {
            const CIcon = cat.icon;
            return (
              <Link
                key={idx}
                href={cat.href}
                className="gov-card p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all text-center space-y-3 group"
              >
                <div className={`p-3 rounded-2xl ${cat.bg} border w-fit mx-auto group-hover:scale-105 transition-transform`}>
                  <CIcon className={`h-6 w-6 ${cat.color}`} />
                </div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{cat.title}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. LATEST GOVERNMENT UPDATES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="gov-card p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Latest Government Gazette Announcements
            </h3>
            <Link href="/news" className="text-xs font-bold text-blue-600 hover:underline">View All News</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">PIB Gazette</span>
              <div className="font-bold text-slate-900">PM Internship Scheme Phase II Opened</div>
              <p className="text-slate-500 text-[11px]">1.25 Lakh new internship slots in top 500 companies with ₹5,000 monthly stipend.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Scholarship Alert</span>
              <div className="font-bold text-slate-900">NSP 2.0 Registration Window Extended</div>
              <p className="text-slate-500 text-[11px]">Apply online via National Scholarship Portal with Aadhaar-seeded accounts.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">Startup India</span>
              <div className="font-bold text-slate-900">Seed Fund Grants Disbursed</div>
              <p className="text-slate-500 text-[11px]">Up to ₹20 Lakh proof-of-concept capital released to 3,500+ startups.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SCHOLARSHIPS SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Student Scholarships & Fellowships
          </h2>
          <Link href="/hubs/student" className="text-xs font-bold text-blue-600 hover:underline">View All Scholarships</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {studentSchemes.map(sch => (
            <SchemeCard key={sch.id} scheme={{ ...sch, match_score: 1.0, rules_matched: 0, rules_total: 0 } as any} isMatchedView={false} />
          ))}
        </div>
      </section>

      {/* 7. STARTUP PROGRAMS SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-amber-600" />
            Startup & Entrepreneurship Capital
          </h2>
          <Link href="/hubs/startup" className="text-xs font-bold text-amber-600 hover:underline">View All Startup Programs</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {startupSchemes.map(sch => (
            <SchemeCard key={sch.id} scheme={{ ...sch, match_score: 1.0, rules_matched: 0, rules_total: 0 } as any} isMatchedView={false} />
          ))}
        </div>
      </section>

      {/* 8. FARMER BENEFITS SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Tractor className="h-5 w-5 text-emerald-600" />
            Farmer & Agriculture Welfare
          </h2>
          <Link href="/hubs/farmer" className="text-xs font-bold text-emerald-600 hover:underline">View All Farmer Schemes</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {farmerSchemes.map(sch => (
            <SchemeCard key={sch.id} scheme={{ ...sch, match_score: 1.0, rules_matched: 0, rules_total: 0 } as any} isMatchedView={false} />
          ))}
        </div>
      </section>

      {/* 9. WOMEN WELFARE SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-pink-600" />
            Women Empowerment & Nari Shakti
          </h2>
          <Link href="/hubs/women" className="text-xs font-bold text-pink-600 hover:underline">View All Women Schemes</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {womenSchemes.map(sch => (
            <SchemeCard key={sch.id} scheme={{ ...sch, match_score: 1.0, rules_matched: 0, rules_total: 0 } as any} isMatchedView={false} />
          ))}
        </div>
      </section>

      {/* 10. HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="gov-card p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-8 text-center">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">How GovSchemeAI Works for Citizens</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">Three simple steps to evaluate eligibility and claim government welfare benefits.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">1</div>
              <h3 className="text-sm font-bold text-slate-900">Enter Profile Details</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Fill your age, state, annual family income, occupation, and social category in the 3-step wizard.</p>
            </div>
            <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">2</div>
              <h3 className="text-sm font-bold text-slate-900">Rule Evaluation Scan</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Engine evaluates rules against official department criteria to compute match percentage and requirements.</p>
            </div>
            <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">3</div>
              <h3 className="text-sm font-bold text-slate-900">Apply Directly</h3>
              <p className="text-xs text-slate-600 leading-relaxed">View required documents checklist and click to apply directly on verified government department portals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. SUCCESS STATISTICS CARDS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="gov-card p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-1 shadow-xs">
            <div className="text-3xl sm:text-4xl font-black text-slate-900">500+</div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active Schemes</div>
          </div>
          <div className="gov-card p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-1 shadow-xs">
            <div className="text-3xl sm:text-4xl font-black text-blue-600">36</div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">States & UTs</div>
          </div>
          <div className="gov-card p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-1 shadow-xs">
            <div className="text-3xl sm:text-4xl font-black text-emerald-600">50+</div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Departments</div>
          </div>
          <div className="gov-card p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-1 shadow-xs">
            <div className="text-3xl sm:text-4xl font-black text-amber-600">100%</div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Verified Sources</div>
          </div>
        </div>
      </section>

      {/* 12. FAQ ACCORDION */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500">Everything you need to know about scheme eligibility and portal verification</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="gov-card rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-slate-900 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="h-4 w-4 text-blue-600 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>

              {openFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
