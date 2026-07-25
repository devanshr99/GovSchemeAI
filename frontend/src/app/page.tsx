'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EligibilityForm } from '../components/eligibility/EligibilityForm';
import {
  ShieldCheck, BookOpen, SlidersHorizontal, Search, HelpCircle, ChevronDown, ChevronUp, Star, ArrowRight, CheckCircle2
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
      a: "Our engine evaluates your age, income, state, and occupation against verified government scheme eligibility structures based on official government guidelines."
    },
    {
      q: "Is my personal data saved?",
      a: "No. Your profile is saved solely in your local browser storage to keep you logged in and display relevant schemes. We do not store your private demographic parameters on our databases."
    },
    {
      q: "What is the role of the AI Assistant?",
      a: "The AI Assistant scans verified scheme records to answer natural language questions about application procedures, required files, helplines, or deadlines."
    },
    {
      q: "Are central and state level schemes both supported?",
      a: "Yes. GovSchemeAI indexes welfare opportunities launched by both the Central Government of India and various state administrations."
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
    <div className="relative min-h-screen flex flex-col justify-start py-12 sm:py-16 px-4 sm:px-6 lg:px-8 space-y-24 overflow-hidden">
      {/* Hero & Eligibility Form Section */}
      <div className="mx-auto max-w-7xl w-full flex flex-col lg:flex-row gap-12 lg:gap-16 items-start justify-between relative z-10">
        {/* Left Column: Title & Metrics */}
        <div className="flex-1 space-y-8 text-left animate-fade-in pt-2">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2563EB]/15 bg-[#EFF6FF] text-xs font-semibold text-[#2563EB]">
              <ShieldCheck className="h-4 w-4 stroke-[2]" />
              <span>Verified Government Welfare Engine</span>
            </div>

            <h1 className="text-4xl sm:text-[56px] leading-[1.1] font-extrabold tracking-tight text-[#101828]">
              Welfare Discoveries <br />
              <span className="text-[#2563EB]">Made Simple for India</span>
            </h1>

            <p className="text-base sm:text-lg text-[#667085] max-w-xl leading-relaxed">
              Find and apply for central and state schemes you qualify for. Overcome information fragmentation and complex rules matrices in seconds.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0">
                <BookOpen className="h-5 w-5 stroke-[2]" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#101828]">
                  {totalSchemes !== null ? `${totalSchemes}+` : '130+'}
                </div>
                <div className="text-xs text-[#667085] font-medium">Active Schemes</div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-[#FFFBEB] flex items-center justify-center text-[#F59E0B] shrink-0">
                <SlidersHorizontal className="h-5 w-5 stroke-[2]" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#101828]">9</div>
                <div className="text-xs text-[#667085] font-medium">Categories</div>
              </div>
            </div>
          </div>

          {/* Key Bullet Trust Indicators */}
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-[#475467]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#12B76A]" /> 100% Free & Open
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#12B76A]" /> No Registration Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#12B76A]" /> Official Direct Links
            </span>
          </div>
        </div>

        {/* Right Column: Questionnaire Form */}
        <div className="w-full lg:max-w-xl animate-slide-up">
          <EligibilityForm />
        </div>
      </div>

      {/* Category Grid Section */}
      <div className="mx-auto max-w-7xl w-full space-y-10 relative z-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-[36px] font-bold tracking-tight text-[#101828]">
            Browse by Scheme <span className="text-[#2563EB]">Categories</span>
          </h2>
          <p className="text-base text-[#667085] max-w-xl mx-auto">
            Discover opportunities tailored specifically by target sector. Click any card to filter programs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <Link
              href={`/schemes?category=${cat.slug}`}
              key={idx}
              className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4 transition-all group cursor-pointer"
            >
              <div className="text-3xl bg-[#F8FAFC] p-3 rounded-xl border border-[#E4E7EC] group-hover:scale-105 transition-transform">
                {cat.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[#101828] mb-1.5 group-hover:text-[#2563EB] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-[#667085] leading-relaxed">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="mx-auto max-w-7xl w-full space-y-10 relative z-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-[36px] font-bold tracking-tight text-[#101828]">
            Trusted by <span className="text-[#2563EB]">Beneficiaries</span> Across India
          </h2>
          <p className="text-base text-[#667085] max-w-xl mx-auto">
            Hear from citizens who successfully navigated scheme qualification with GovSchemeAI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-5 border-l-4 border-l-[#2563EB]">
              <div className="space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                  ))}
                </div>
                <p className="text-sm text-[#344054] leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <div className="border-t border-[#EAECF0] pt-4">
                <h4 className="font-semibold text-sm text-[#101828]">{t.name}</h4>
                <p className="text-xs text-[#667085]">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="mx-auto max-w-3xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-[36px] font-bold tracking-tight text-[#101828] flex items-center justify-center gap-2.5">
            <HelpCircle className="h-8 w-8 text-[#2563EB]" />
            Frequently Asked Questions
          </h2>
          <p className="text-base text-[#667085]">
            Everything you need to know about criteria validations and safety configurations.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="glass-panel rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-[#F8FAFC] transition-all cursor-pointer"
                >
                  <span className="font-semibold text-base text-[#101828]">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-[#667085] shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#667085] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-[#667085] leading-relaxed border-t border-[#F2F4F7] bg-[#FAFAFA] animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action CTA Banner */}
      <div className="mx-auto max-w-5xl w-full relative z-10">
        <div className="bg-[#2563EB] rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Check Your Scheme Match Today</h2>
            <p className="text-sm sm:text-base text-white/90 max-w-md mx-auto leading-relaxed">
              Don&apos;t miss out on financial support or subsidies. Use our eligibility checker to run a scan or browse schemes by ministry.
            </p>
          </div>
          <div className="flex justify-center relative z-10">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-[#F8FAFC] text-[#2563EB] rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Free Scan
              <Search className="h-4 w-4 stroke-[2]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
