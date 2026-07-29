'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EligibilityForm } from '../components/eligibility/EligibilityForm';
import {
  ShieldCheck, Award, Users, BookOpen, Search, SlidersHorizontal,
  HelpCircle, ChevronDown, ChevronUp, Star, ArrowRight, CheckCircle2,
  Building2, Landmark, FileText, Compass, Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import Link from 'next/link';

export default function Home() {
  const { t } = useApp();
  const [totalSchemes, setTotalSchemes] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    api.getSchemes({ pageSize: 1, activeOnly: true })
      .then(res => setTotalSchemes(res.total))
      .catch(err => console.error('Failed to fetch scheme stats:', err));
  }, []);

  const faqs = [
    {
      q: "How does GovSchemeAI evaluate scheme eligibility?",
      a: "Our evaluation engine tests citizen profiles against official guidelines published by Central and State ministries. Age limits, income ceilings, land size, social category, and occupation are checked directly against department criteria."
    },
    {
      q: "Is citizen profile information kept private?",
      a: "Yes. All demographic parameters are evaluated locally in your session. We do not sell, store, or transmit your private identity details to third-party servers."
    },
    {
      q: "What is the Digital Scheme Advisor?",
      a: "The Digital Scheme Advisor is an interactive assistant trained on official government gazettes, department portals, and helpline guidelines to answer questions about required documents, application steps, and deadlines."
    },
    {
      q: "Does the portal cover State Government schemes as well as Central schemes?",
      a: "Yes. GovSchemeAI indexes welfare opportunities launched by the Central Government of India as well as state administrations across all 36 States and Union Territories."
    }
  ];

  const testimonials = [
    {
      name: "Rameshwar Prasad",
      role: "Farmer, Uttar Pradesh",
      quote: "GovSchemeAI verified my land holding size and age constraints, matching me directly to PM-KISAN. The document checklist saved me weeks of office visits."
    },
    {
      name: "Anjali Deshmukh",
      role: "Engineering Student, Maharashtra",
      quote: "Finding state scholarships used to be overwhelming. GovSchemeAI evaluated my OBC category and income level, highlighting 3 eligible education grants instantly."
    },
    {
      name: "Harish Nair",
      role: "MSME Entrepreneur, Karnataka",
      quote: "The business subsidy lookup was accurate and fast. The Digital Scheme Advisor provided exact helpline numbers and bank submission guidelines for Mudra."
    }
  ];

  const categories = [
    { icon: '🌾', name: 'Agriculture & Farmers', slug: 'agriculture', desc: 'Crop insurance, equipment credit, fertilizer subsidies, and PM-KISAN grants.' },
    { icon: '🎓', name: 'Education & Learning', slug: 'education', desc: 'Pre-matric & post-matric scholarships, fellowships, and student education loans.' },
    { icon: '🏥', name: 'Health & Wellness', slug: 'health', desc: 'Ayushman Bharat insurance, maternal aid, and subsidized hospital treatments.' },
    { icon: '🏠', name: 'Housing & Infrastructure', slug: 'housing', desc: 'PM Awas Yojana urban & rural housing grants, toilet construction aids.' },
    { icon: '💼', name: 'Employment & Skill Development', slug: 'employment', desc: 'Skill India training programs, self-employment credit, and labor welfare cards.' },
    { icon: '🚀', name: 'MSME & Business Credit', slug: 'business', desc: 'PMEGP loans, Mudra credit line, startup subsidies, and collateral-free capital.' }
  ];

  const steps = [
    {
      step: '01',
      title: 'Enter Citizen Profile',
      desc: 'Fill out the 3-step questionnaire with basic demographics (age, state, income, category).'
    },
    {
      step: '02',
      title: 'Automated Criteria Evaluation',
      desc: 'Our rule engine matches your details against verified department gazettes and scheme rules.'
    },
    {
      step: '03',
      title: 'Review Matches & Apply Direct',
      desc: 'Access eligibility scores, document checklists, and official portal application links.'
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-start py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-20 overflow-hidden">
      {/* Background Geometric Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none overflow-hidden opacity-20 z-0">
        <div className="absolute -top-20 left-1/3 w-[500px] h-[500px] rounded-full bg-blue-600/30 blur-[140px]" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-600/20 blur-[120px]" />
      </div>

      {/* Hero & Questionnaire Section */}
      <div className="mx-auto max-w-7xl w-full flex flex-col lg:flex-row gap-10 lg:gap-14 items-start justify-between relative z-10 pt-4">
        {/* Left Column: Hero Copy & Portal Emblem */}
        <div className="flex-1 space-y-8 text-left animate-fade-in lg:pt-4">
          <div className="space-y-5">
            {/* Top Official Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-950/60 text-xs font-semibold text-blue-300">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span>National Citizen Welfare Portal • Official Rule Engine</span>
            </div>

            {/* Hero Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-slate-100 tracking-tight leading-[1.15]">
              Discover Government Schemes You Qualify For
            </h1>

            {/* Hero Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Evaluate eligibility against official Central and State government guidelines in seconds. Eliminate multi-portal confusion and access financial aid, scholarships, and farming subsidies directly.
            </p>

            {/* Hero Dual CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  const formElem = document.getElementById('eligibility-section');
                  formElem?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Check Scheme Eligibility</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <Link
                href="/schemes"
                className="px-6 py-3 bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white rounded-xl font-semibold text-xs transition-all flex items-center gap-2"
              >
                <Search className="h-4 w-4 text-slate-400" />
                <span>Browse All Schemes</span>
              </Link>
            </div>
          </div>

          {/* Key Portal Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/[0.08]">
            <div className="gov-card p-3.5 rounded-xl text-left border-white/[0.06]">
              <div className="text-lg sm:text-xl font-black text-slate-100">
                {totalSchemes !== null ? `${totalSchemes}+` : '130+'}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
                Active Schemes
              </div>
            </div>

            <div className="gov-card p-3.5 rounded-xl text-left border-white/[0.06]">
              <div className="text-lg sm:text-xl font-black text-amber-400">36</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
                States & UTs
              </div>
            </div>

            <div className="gov-card p-3.5 rounded-xl text-left border-white/[0.06]">
              <div className="text-lg sm:text-xl font-black text-blue-400">9</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
                Target Sectors
              </div>
            </div>

            <div className="gov-card p-3.5 rounded-xl text-left border-white/[0.06]">
              <div className="text-lg sm:text-xl font-black text-emerald-400">100%</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
                Verified Rules
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Guided Form */}
        <div id="eligibility-section" className="w-full lg:max-w-xl animate-slide-up shrink-0">
          <EligibilityForm />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="mx-auto max-w-7xl w-full space-y-8 relative z-10 pt-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/20 text-[11px] font-bold text-blue-300 uppercase tracking-wider">
            Clear Workflow
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
            How GovSchemeAI Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            A simple, transparent 3-step evaluation model designed for all Indian citizens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((st, idx) => (
            <div key={idx} className="gov-card p-6 rounded-2xl border border-white/[0.08] relative space-y-3">
              <div className="text-3xl font-black text-blue-500/40">{st.step}</div>
              <h3 className="text-base font-bold text-slate-100">{st.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scheme Categories Grid */}
      <div className="mx-auto max-w-7xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
            Explore Welfare Opportunities by Sector
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Select a target sector to view specialized Central and State programs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <Link
              href={`/schemes?category=${cat.slug}`}
              key={idx}
              className="gov-card gov-card-hover p-6 rounded-2xl flex flex-col justify-between border border-white/[0.08] group cursor-pointer space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-white/10">{cat.icon}</span>
                <h3 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors text-base">
                  {cat.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{cat.desc}</p>
              <div className="text-xs text-blue-400 font-bold flex items-center gap-1 group-hover:underline pt-2 border-t border-white/[0.04]">
                <span>Browse Sector Schemes</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Citizen Success Stories / Testimonials */}
      <div className="mx-auto max-w-7xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
            Trusted by Beneficiaries Across India
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Hear how farmers, students, and small business owners matched with verified benefits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="gov-card p-6 rounded-2xl border border-white/[0.08] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>
              <div className="border-t border-white/[0.06] pt-3">
                <h4 className="font-bold text-xs text-slate-100">{t.name}</h4>
                <p className="text-[10px] text-slate-400 font-medium">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mx-auto max-w-3xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-blue-400" />
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Answers regarding rule calculations, data security, and scheme updates.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="gov-card rounded-2xl overflow-hidden border border-white/[0.08] transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-white/[0.02] transition-all cursor-pointer"
                >
                  <span className="font-bold text-sm text-slate-100">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.04] bg-slate-900/50 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action CTA */}
      <div className="mx-auto max-w-5xl w-full relative z-10 pt-4">
        <div className="gov-card bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 border border-white/[0.1] text-center space-y-5 relative overflow-hidden shadow-2xl">
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">Check Your Scheme Qualification</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Don't leave government benefits unclaimed. Run an eligibility check or consult the Digital Scheme Advisor today.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 relative z-10">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer text-xs"
            >
              <span>Start Questionnaire</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 rounded-xl font-semibold transition-all text-xs"
            >
              <span>Consult Scheme Advisor</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

