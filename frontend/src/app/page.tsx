'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EligibilityForm } from '../components/eligibility/EligibilityForm';
import {
  ShieldCheck, Award, Users, BookOpen, Brain, ClipboardCheck,
  Bot, Search, SlidersHorizontal, Database, RefreshCw, Sparkles,
  Zap, MonitorSmartphone, HelpCircle, ChevronDown, ChevronUp, Star
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
      q: "How does GovSchemeAI check my eligibility?",
      a: "Our deterministic rules engine runs your age, income, state, and occupation against verified government scheme eligibility structures. Rather than guessing, we evaluate rules exactly as department guides lay them down."
    },
    {
      q: "Is my personal data saved?",
      a: "No. Your profile is saved solely in your local browser storage to keep you logged in and display relevant schemes. We do not store your private demographic parameters on our databases."
    },
    {
      q: "What is the role of the AI Assistant?",
      a: "The AI Assistant uses Retrieval-Augmented Generation (RAG) to scan verified scheme records and answer natural language questions about application procedures, required files, helplines, or deadlines."
    },
    {
      q: "Are central and state level schemes both supported?",
      a: "Yes. GovSchemeAI indexes welfare opportunities launched by both the Central Government of India and various state administrations (e.g. Uttar Pradesh, Maharashtra, Karnataka)."
    }
  ];

  const testimonials = [
    {
      name: "Rameshwar Prasad",
      role: "Farmer, Uttar Pradesh",
      quote: "GovSchemeAI verified my land size and age constraints, matching me to PM-KISAN. I got the benefit in days after reading their checklist."
    },
    {
      name: "Anjali Deshmukh",
      role: "College Student, Maharashtra",
      quote: "I searched for scholarships but got lost on government portals. GovSchemeAI showed me 3 education schemes matching my OBC category in seconds!"
    },
    {
      name: "Harish Nair",
      role: "MSME Entrepreneur, Karnataka",
      quote: "The business loan search was incredibly fast. The AI Assistant told me exactly which documents were needed for the Mudra loan."
    }
  ];

  const categories = [
    { icon: '🌾', name: 'Agriculture & Farmers', slug: 'agriculture', desc: 'Crop insurance, equipment support, fertilizer subsidies.' },
    { icon: '🎓', name: 'Education & Learning', slug: 'education', desc: 'Scholarships, fellowships, student loans, training guides.' },
    { icon: '🏥', name: 'Health & Wellness', slug: 'health', desc: 'Medical insurance policies, hospitals access, pregnancy aids.' },
    { icon: '🏠', name: 'Housing & Shelter', slug: 'housing', desc: 'Urban/rural construction assistance, sanitation incentives.' },
    { icon: '💼', name: 'Employment & Skills', slug: 'employment', desc: 'Skill programs, self-employment benefits, labor cards.' },
    { icon: '🚀', name: 'Business & Mudra', slug: 'business', desc: 'MSME loans, credit linkages, startup subsidies.' }
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-start py-12 px-4 sm:px-6 lg:px-8 space-y-20 overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none overflow-hidden opacity-30 z-0">
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] rounded-full bg-orange-500/20 blur-[80px]" />
      </div>

      {/* Hero & Form Section */}
      <div className="mx-auto max-w-7xl w-full flex flex-col lg:flex-row gap-12 items-center justify-between relative z-10">
        {/* Left Column: Hero & Statistics */}
        <div className="flex-1 space-y-8 text-center lg:text-left animate-fade-in">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 text-xs font-semibold text-blue-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Direct Matching • Verified Government Rules</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="block text-slate-100">Welfare Discoveries</span>
              <span className="block bg-gradient-to-r from-orange-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Made Simple for India
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Find and apply for central and state schemes you qualify for. Overcome information fragmentation and complex rules matrices in seconds.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border-white/[0.06]">
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

            <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border-white/[0.06]">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <SlidersHorizontal className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-100">9</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Categories</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Questionnaire Form */}
        <div className="w-full lg:max-w-xl animate-slide-up">
          <EligibilityForm />
        </div>
      </div>

      {/* Categories Discovery */}
      <div className="mx-auto max-w-7xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Browse by Scheme <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Categories</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Discover opportunities tailored specifically by target sector. Click any card to filter programs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <Link
              href={`/schemes?category=${cat.slug}`}
              key={idx}
              className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4 border border-white/[0.06] transition-all group cursor-pointer"
            >
              <div className="text-3xl bg-slate-800 p-2.5 rounded-xl border border-white/[0.05] group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-100 mb-1 group-hover:text-blue-400 transition-colors text-base">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="mx-auto max-w-7xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Trusted by <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Citizens</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Hear from rural and urban beneficiaries who successfully navigated scheme qualification with GovSchemeAI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-white/[0.06] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-orange-400 text-orange-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>
              <div className="border-t border-white/[0.05] pt-3">
                <h4 className="font-bold text-xs text-slate-100">{t.name}</h4>
                <p className="text-[10px] text-slate-500 font-medium">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mx-auto max-w-3xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 flex items-center justify-center gap-2">
            <HelpCircle className="h-7 w-7 text-indigo-400" />
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything you need to know about criteria validations and safety configurations.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="glass-panel rounded-2xl overflow-hidden border border-white/[0.06] transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-white/[0.01] transition-all cursor-pointer"
                >
                  <span className="font-bold text-sm text-slate-100">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/[0.02] bg-white/[0.005] animate-fade-in">
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
        <div className="glass-panel bg-gradient-to-br from-blue-900/20 via-slate-900 to-indigo-900/20 rounded-3xl p-8 sm:p-12 border border-white/[0.08] text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.1),transparent_50%)]" />
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">Check Your Scheme Match Today</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Don't miss out on financial support or subsidies. Use our eligibility checker to run a scan or browse schemes by ministry.
            </p>
          </div>
          <div className="flex justify-center relative z-10">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-xs"
            >
              Start Free Scan
              <Sparkles className="h-4 w-4 text-orange-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
