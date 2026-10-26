'use client';

import React from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  Rocket, 
  Sprout, 
  HeartHandshake, 
  Briefcase, 
  Building2, 
  ArrowRight, 
  Grid,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function HubsIndexPage() {
  const hubs = [
    {
      slug: 'student',
      title: 'Student Hub & Scholarships',
      icon: GraduationCap,
      color: 'text-blue-400',
      badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      badge: 'Education & Grants',
      desc: 'National Scholarship Portal schemes, fellowship allowances, educational fee exemptions, and study loan subventions.',
      highlights: ['Pre-Matric & Post-Matric Scholarships', 'DBT Direct Benefit Transfer', 'Research Stipends & Fellowships']
    },
    {
      slug: 'startup',
      title: 'Startup & Innovation Hub',
      icon: Rocket,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      badge: 'Seed Capital & Credit',
      desc: 'Startup India seed funding, Mudra micro credit, collateral-free credit guarantees, incubator support & patent rebates.',
      highlights: ['Seed Fund Scheme', 'Mudra Loans (Up to ₹10L)', 'Incubator Assistance & Mentorship']
    },
    {
      slug: 'farmer',
      title: 'Farmer & Agriculture Hub',
      icon: Sprout,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      badge: 'Kisan Welfare',
      desc: 'PM-KISAN direct credit installments, PM Fasal Bima Yojana crop insurance, solar pump subsidies & fertilizer aid.',
      highlights: ['PM-KISAN ₹6,000 Annual Credit', 'Crop Insurance Claims & Protection', 'Kisan Credit Card (KCC)']
    },
    {
      slug: 'women',
      title: 'Women Welfare Hub',
      icon: HeartHandshake,
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      badge: 'Health & Empowerment',
      desc: 'Pradhan Mantri Matru Vandana Yojana maternity benefits, Sukanya Samriddhi Yojana for girl child, SHG micro credit.',
      highlights: ['Maternity Cash Assistance', 'Girl Child Savings Plans', 'Self-Help Group (SHG) Low-Interest Credit']
    },
    {
      slug: 'youth',
      title: 'Youth & Skill Hub',
      icon: Briefcase,
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      badge: 'Employment & Skills',
      desc: 'Pradhan Mantri Kaushal Vikas Yojana skill training, apprenticeship stipends, employment exchange registration.',
      highlights: ['Free Vocational Certification', 'Apprenticeship Monthly Allowances', 'Placement & Industry Linkages']
    },
    {
      slug: 'msme',
      title: 'MSME & Business Hub',
      icon: Building2,
      color: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      badge: 'Micro Enterprise',
      desc: 'Udyam registration benefits, MSME credit guarantee scheme (CGTMSE), technology up-gradation & export assistance.',
      highlights: ['Collateral-Free Business Loans', 'Technology Upgrade Subsidies', 'Export Market Linkages']
    }
  ];

  return (
    <div className="mx-auto max-w-7xl w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-10 relative z-10 animate-fade-in">
      
      {/* Title Header */}
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider">
          <Grid className="h-3.5 w-3.5" />
          <span>Specialized Citizen Portals</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight">
          Government Sector Hubs
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Curated welfare directories designed around specific citizen segments: students, entrepreneurs, farmers, women, and business owners.
        </p>
      </div>

      {/* Hubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubs.map((hub) => {
          const Icon = hub.icon;
          return (
            <Link
              key={hub.slug}
              href={`/hubs/${hub.slug}`}
              className="p-6 rounded-3xl flex flex-col justify-between space-y-6 group cursor-pointer border border-slate-800 bg-[#111827] hover:border-blue-500/50 hover:bg-[#141d2e] transition-all shadow-md"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-[#0b0f19] border border-slate-800 flex items-center justify-center group-hover:border-blue-500/40 transition-colors">
                    <Icon className={`h-6 w-6 ${hub.color}`} />
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg border ${hub.badgeBg}`}>
                    {hub.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="font-heading text-lg font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                    {hub.title}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {hub.desc}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Key Focus Areas:
                  </span>
                  {hub.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center text-xs font-bold text-blue-400 pt-3 border-t border-slate-800/80 group-hover:text-blue-300">
                <span>Enter Sector Hub</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
