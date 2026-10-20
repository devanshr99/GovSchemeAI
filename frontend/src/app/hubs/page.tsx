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
  Grid 
} from 'lucide-react';

export default function HubsIndexPage() {
  const hubs = [
    {
      slug: 'student',
      title: 'Student Hub & Scholarships',
      icon: GraduationCap,
      color: 'text-purple-400',
      badge: 'Education & Grants',
      desc: 'National Scholarship Portal schemes, fellowship allowances, educational fee exemptions, and study loan subventions.',
      highlights: ['Pre-Matric & Post-Matric Scholarships', 'DBT Direct Benefit Transfer', 'Research Stipends & Fellowships']
    },
    {
      slug: 'startup',
      title: 'Startup & Innovation Hub',
      icon: Rocket,
      color: 'text-cyan-400',
      badge: 'Seed Capital & Credit',
      desc: 'Startup India seed funding, Mudra micro credit, collateral-free credit guarantees, incubator support & patent rebates.',
      highlights: ['Seed Fund Scheme', 'Mudra Loans (Up to ₹10L)', 'Incubator Assistance & Mentorship']
    },
    {
      slug: 'farmer',
      title: 'Farmer & Agriculture Hub',
      icon: Sprout,
      color: 'text-emerald-400',
      badge: 'Kisan Welfare',
      desc: 'PM-KISAN direct credit installments, PM Fasal Bima Yojana crop insurance, solar pump subsidies & fertilizer aid.',
      highlights: ['PM-KISAN ₹6,000 Annual Credit', 'Crop Insurance Claims & Protection', 'Kisan Credit Card (KCC)']
    },
    {
      slug: 'women',
      title: 'Women Welfare Hub',
      icon: HeartHandshake,
      color: 'text-pink-400',
      badge: 'Health & Empowerment',
      desc: 'Pradhan Mantri Matru Vandana Yojana maternity benefits, Sukanya Samriddhi Yojana for girl child, SHG micro credit.',
      highlights: ['Maternity Cash Assistance', 'Girl Child Savings Plans', 'Self-Help Group (SHG) Low-Interest Credit']
    },
    {
      slug: 'youth',
      title: 'Youth & Skill Hub',
      icon: Briefcase,
      color: 'text-amber-400',
      badge: 'Employment & Skills',
      desc: 'Pradhan Mantri Kaushal Vikas Yojana skill training, apprenticeship stipends, employment exchange registration.',
      highlights: ['Free Vocational Certification', 'Apprenticeship Monthly Allowances', 'Placement & Industry Linkages']
    },
    {
      slug: 'msme',
      title: 'MSME & Business Hub',
      icon: Building2,
      color: 'text-indigo-400',
      badge: 'Micro Enterprise',
      desc: 'Udyam registration benefits, MSME credit guarantee scheme (CGTMSE), technology up-gradation & export assistance.',
      highlights: ['Collateral-Free Business Loans', 'Technology Upgrade Subsidies', 'Export Market Linkages']
    }
  ];

  return (
    <div className="mx-auto max-w-7xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-10 relative z-10 animate-fade-in">
      
      {/* Title Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
          <Grid className="h-3.5 w-3.5" />
          <span>Specialized Citizen Portals</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-100">
          Government Sector Hubs
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Targeted discovery channels for students, entrepreneurs, farmers, women, and enterprise owners.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubs.map((hub) => {
          const Icon = hub.icon;
          return (
            <Link
              key={hub.slug}
              href={`/hubs/${hub.slug}`}
              className="gov-card gov-card-hover p-6 rounded-3xl flex flex-col justify-between space-y-5 group cursor-pointer border border-white/[0.08]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-[#0E1017] border border-white/[0.08] flex items-center justify-center group-hover:border-purple-500/50 transition-colors">
                    <Icon className={`h-6 w-6 ${hub.color}`} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                    {hub.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="font-heading text-base font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                    {hub.title}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {hub.desc}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">Key Focus Areas:</span>
                  {hub.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <span className="text-purple-400">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center text-xs font-bold text-purple-400 pt-2 border-t border-white/[0.04]">
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
