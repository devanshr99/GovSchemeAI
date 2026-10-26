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
  CheckCircle2 
} from 'lucide-react';

export default function HubsIndexPage() {
  const hubs = [
    {
      slug: 'student',
      title: 'Student Hub & Scholarships',
      icon: GraduationCap,
      color: 'text-[#176B52]',
      iconBg: 'bg-[#E7F3EC]',
      badgeBg: 'bg-[#E7F3EC] text-[#176B52] border-[#176B52]/20',
      badge: 'Education & Grants',
      desc: 'National Scholarship Portal schemes, fellowship allowances, educational fee exemptions, and study loan subventions.',
      highlights: ['Pre-Matric & Post-Matric Scholarships', 'DBT Direct Benefit Transfer', 'Research Stipends & Fellowships']
    },
    {
      slug: 'startup',
      title: 'Startup & Innovation Hub',
      icon: Rocket,
      color: 'text-[#176B52]',
      iconBg: 'bg-[#E7F3EC]',
      badgeBg: 'bg-[#E7F3EC] text-[#176B52] border-[#176B52]/20',
      badge: 'Seed Capital & Credit',
      desc: 'Startup India seed funding, Mudra micro credit, collateral-free credit guarantees, incubator support & patent rebates.',
      highlights: ['Seed Fund Scheme', 'Mudra Loans (Up to ₹10L)', 'Incubator Assistance & Mentorship']
    },
    {
      slug: 'farmer',
      title: 'Farmer & Agriculture Hub',
      icon: Sprout,
      color: 'text-[#176B52]',
      iconBg: 'bg-[#EBF2EB]',
      badgeBg: 'bg-[#EBF2EB] text-[#124C3D] border-[#DDE9DF]',
      badge: 'Kisan Welfare',
      desc: 'PM-KISAN direct credit installments, PM Fasal Bima Yojana crop insurance, solar pump subsidies & fertilizer aid.',
      highlights: ['PM-KISAN ₹6,000 Annual Credit', 'Crop Insurance Claims & Protection', 'Kisan Credit Card (KCC)']
    },
    {
      slug: 'women',
      title: 'Women Welfare Hub',
      icon: HeartHandshake,
      color: 'text-[#E8A126]',
      iconBg: 'bg-[#FAF5E9]',
      badgeBg: 'bg-[#FAF5E9] text-[#8C6212] border-[#F3E7CA]',
      badge: 'Health & Empowerment',
      desc: 'Pradhan Mantri Matru Vandana Yojana maternity benefits, Sukanya Samriddhi Yojana for girl child, SHG micro credit.',
      highlights: ['Maternity Cash Assistance', 'Girl Child Savings Plans', 'Self-Help Group (SHG) Low-Interest Credit']
    },
    {
      slug: 'youth',
      title: 'Youth & Skill Hub',
      icon: Briefcase,
      color: 'text-[#202820]',
      iconBg: 'bg-[#F7F8F5]',
      badgeBg: 'bg-[#F7F8F5] text-[#202820] border-[#E5E9E3]',
      badge: 'Employment & Skills',
      desc: 'Pradhan Mantri Kaushal Vikas Yojana skill training, apprenticeship stipends, employment exchange registration.',
      highlights: ['Free Vocational Certification', 'Apprenticeship Monthly Allowances', 'Placement & Industry Linkages']
    },
    {
      slug: 'msme',
      title: 'MSME & Business Hub',
      icon: Building2,
      color: 'text-[#176B52]',
      iconBg: 'bg-[#EBF5F0]',
      badgeBg: 'bg-[#EBF5F0] text-[#124C3D] border-[#DDE9DF]',
      badge: 'Micro Enterprise',
      desc: 'Udyam registration benefits, MSME credit guarantee scheme (CGTMSE), technology up-gradation & export assistance.',
      highlights: ['Collateral-Free Business Loans', 'Technology Upgrade Subsidies', 'Export Market Linkages']
    }
  ];

  return (
    <div className="mx-auto max-w-7xl w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-10 relative z-10 animate-fade-in">
      
      {/* Title Header */}
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3EC] text-[#176B52] border border-[#176B52]/20 text-xs font-semibold uppercase tracking-wider">
          <Grid className="h-3.5 w-3.5" />
          <span>Specialized Citizen Portals</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#202820] tracking-tight">
          Government Sector Hubs
        </h1>
        <p className="text-xs sm:text-sm text-[#687368] leading-relaxed">
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
              className="p-6 rounded-3xl flex flex-col justify-between space-y-6 group cursor-pointer border border-[#E5E9E3] bg-white hover:border-[#176B52]/40 transition-all shadow-xs hover:shadow-md"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`h-12 w-12 rounded-2xl ${hub.iconBg} border border-[#E5E9E3] flex items-center justify-center transition-colors`}>
                    <Icon className={`h-6 w-6 ${hub.color}`} />
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${hub.badgeBg}`}>
                    {hub.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="font-heading text-lg font-bold text-[#202820] group-hover:text-[#176B52] transition-colors">
                    {hub.title}
                  </h2>
                  <p className="text-xs text-[#687368] leading-relaxed">
                    {hub.desc}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#E5E9E3]">
                  <span className="text-[10px] uppercase font-bold text-[#687368] tracking-wider block">
                    Key Focus Areas:
                  </span>
                  {hub.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#4F594F]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#176B52] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center text-xs font-semibold text-[#176B52] pt-3 border-t border-[#E5E9E3] group-hover:text-[#124C3D]">
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
