'use client';

import React from 'react';
import Link from 'next/link';
import { 
  GraduationCap, Rocket, Sprout, HeartHandshake, Briefcase, Building2, 
  ArrowRight, Grid, ShieldCheck 
} from 'lucide-react';

export default function HubsIndexPage() {
  const hubs = [
    {
      slug: 'student',
      title: 'Student Hub & Scholarships',
      icon: GraduationCap,
      color: 'text-[#A855F7]',
      desc: 'National Scholarship Portal schemes, fellowship allowances, educational fee exemptions, and study loan subventions.',
      highlights: ['Pre-Matric & Post-Matric Scholarships', 'DBT Direct Benefit Transfer', 'Research Fellowships']
    },
    {
      slug: 'startup',
      title: 'Startup & Innovation Hub',
      icon: Rocket,
      color: 'text-[#06B6D4]',
      desc: 'Startup India seed funding, Mudra micro credit, collateral-free credit guarantees, incubator support & patent rebates.',
      highlights: ['Seed Fund Scheme', 'Mudra Loans', 'Incubator Assistance']
    },
    {
      slug: 'farmer',
      title: 'Farmer & Agriculture Hub',
      icon: Sprout,
      color: 'text-[#22C55E]',
      desc: 'PM-KISAN direct credit installments, PM Fasal Bima Yojana crop insurance, solar pump subsidies & fertilizer aid.',
      highlights: ['PM-KISAN ₹6,000 Annual Credit', 'Crop Insurance Claims', 'Kisan Credit Card (KCC)']
    },
    {
      slug: 'women',
      title: 'Women Welfare Hub',
      icon: HeartHandshake,
      color: 'text-[#EC4899]',
      desc: 'Pradhan Mantri Matru Vandana Yojana maternity benefits, Sukanya Samriddhi Yojana for girl child, SHG micro credit.',
      highlights: ['Maternity Cash Assistance', 'Girl Child Savings Plans', 'Self-Help Group Credit']
    },
    {
      slug: 'youth',
      title: 'Youth & Skill Hub',
      icon: Briefcase,
      color: 'text-amber-400',
      desc: 'Pradhan Mantri Kaushal Vikas Yojana skill training, apprenticeship stipends, employment exchange registration.',
      highlights: ['Free Vocational Training', 'Apprenticeship Allowances', 'Employment Linkages']
    },
    {
      slug: 'msme',
      title: 'MSME & Business Hub',
      icon: Building2,
      color: 'text-[#8B5CF6]',
      desc: 'Udyam registration benefits, MSME credit guarantee scheme (CGTMSE), technology up-gradation & export assistance.',
      highlights: ['Collateral-Free Business Loans', 'Technology Subsidies', 'Export Market Development']
    }
  ];

  return (
    <div className="mx-auto max-w-6xl w-full py-10 px-4 sm:px-6 lg:px-8 space-y-10 relative z-10 animate-fade-in">
      
      {/* Title Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/15 text-[#A855F7] border border-[#8B5CF6]/30 text-xs font-bold uppercase tracking-wider">
          <Grid className="h-3.5 w-3.5" />
          <span>Sector Portals</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#F5F5F7]">
          Government Sector Hubs
        </h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
          Targeted discovery channels for students, entrepreneurs, farmers, women, and business owners.
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
              className="gov-card gov-card-hover p-6 rounded-3xl flex flex-col justify-between space-y-5 group cursor-pointer border-[#242832]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-[#0D0F14] border border-[#242832] flex items-center justify-center group-hover:border-[#8B5CF6]/50 transition-colors">
                  <Icon className={`h-6 w-6 ${hub.color}`} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-[#F5F5F7] group-hover:text-[#A855F7] transition-colors">
                    {hub.title}
                  </h2>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    {hub.desc}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#242832]">
                  <span className="text-[9px] uppercase font-extrabold text-[#71717A] tracking-wider block">Key Focus Areas:</span>
                  {hub.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-[#A1A1AA]">
                      <span className="text-[#A855F7]">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center text-xs font-bold text-[#A855F7] pt-2">
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
