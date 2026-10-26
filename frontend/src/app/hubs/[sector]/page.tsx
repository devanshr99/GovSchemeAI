'use client';

import React, { useState, useEffect, use } from 'react';
import { api } from '../../../lib/api';
import { SchemeCard } from '../../../components/schemes/SchemeCard';
import { CompareFloatingBar } from '../../../components/common/CompareFloatingBar';
import { SchemeCard as SchemeCardType } from '../../../types/scheme';
import Link from 'next/link';
import { 
  GraduationCap, 
  Rocket, 
  Sprout, 
  HeartHandshake, 
  Briefcase, 
  Building2, 
  ArrowLeft, 
  Search, 
  ShieldCheck, 
  LucideIcon 
} from 'lucide-react';

interface SectorConfig {
  title: string;
  categorySlug: string;
  icon: LucideIcon;
  badge: string;
  badgeBg: string;
  subtitle: string;
  description: string;
  stats: { label: string; value: string }[];
}

const SECTOR_MAP: Record<string, SectorConfig> = {
  student: {
    title: 'Student Hub & Scholarships',
    categorySlug: 'education',
    icon: GraduationCap,
    badge: 'Education & Grants',
    badgeBg: 'bg-[#E7F3EC] text-[#176B52] border-[#176B52]/20',
    subtitle: 'Scholarships, Fee Subventions & Fellowships',
    description: 'Index of central and state scholarships, National Scholarship Portal opportunities, research stipends, and higher education loan assistance.',
    stats: [
      { label: 'Scholarships Index', value: '45+' },
      { label: 'DBT Direct Transfer', value: '100%' },
      { label: 'Coverage', value: 'Pan-India' },
    ]
  },
  startup: {
    title: 'Startup & Innovation Hub',
    categorySlug: 'business',
    icon: Rocket,
    badge: 'Enterprise & Seed Grants',
    badgeBg: 'bg-[#E7F3EC] text-[#176B52] border-[#176B52]/20',
    subtitle: 'Startup India Seed Funding & Mudra Loans',
    description: 'Discover collateral-free credit guarantees, Startup India seed grants, patent registration rebates, and state incubator subsidies.',
    stats: [
      { label: 'Credit Limit', value: 'Up to ₹10L' },
      { label: 'Processing', value: 'Direct Bank Link' },
      { label: 'Incubators', value: '500+ Partnered' },
    ]
  },
  farmer: {
    title: 'Farmer & Agriculture Hub',
    categorySlug: 'agriculture',
    icon: Sprout,
    badge: 'Kisan Welfare Portal',
    badgeBg: 'bg-[#EBF2EB] text-[#124C3D] border-[#DDE9DF]',
    subtitle: 'PM-KISAN, Crop Insurance & Fertilizer Aids',
    description: 'Financial support for Indian farmers: PM-KISAN installment credits, PM Fasal Bima Yojana crop insurance, Kisan Credit Cards, and solar pumps.',
    stats: [
      { label: 'Annual Installment', value: '₹6,000' },
      { label: 'Insurance Coverage', value: '100% Crops' },
      { label: 'KCC Interest', value: 'Subsidized' },
    ]
  },
  women: {
    title: 'Women Welfare Hub',
    categorySlug: 'health',
    icon: HeartHandshake,
    badge: 'Women Empowerment Portal',
    badgeBg: 'bg-[#FAF5E9] text-[#8C6212] border-[#F3E7CA]',
    subtitle: 'Maternity Benefits, SHG Loans & Savings Plans',
    description: 'Dedicated welfare schemes for women: Pradhan Mantri Matru Vandana Yojana, Sukanya Samriddhi Yojana for girl child, and self-help group micro credits.',
    stats: [
      { label: 'Maternity Aid', value: '₹5,000+' },
      { label: 'Sukanya Interest', value: 'High Yield' },
      { label: 'SHG Linkages', value: 'Active' },
    ]
  },
  youth: {
    title: 'Youth & Skill Hub',
    categorySlug: 'employment',
    icon: Briefcase,
    badge: 'Youth & Skill Development',
    badgeBg: 'bg-[#F7F8F5] text-[#202820] border-[#E5E9E3]',
    subtitle: 'PM Kaushal Vikas & Apprenticeship Stipends',
    description: 'Empowering young citizens through skill certification courses, paid apprenticeship allowances, and job matching linkages.',
    stats: [
      { label: 'Skill Courses', value: '300+' },
      { label: 'Apprentice Allowance', value: 'Monthly' },
      { label: 'Placement Support', value: 'Available' },
    ]
  },
  msme: {
    title: 'MSME & Business Hub',
    categorySlug: 'business',
    icon: Building2,
    badge: 'Micro & Small Business Portal',
    badgeBg: 'bg-[#EBF5F0] text-[#124C3D] border-[#DDE9DF]',
    subtitle: 'Collateral-Free Credit & Technology Grants',
    description: 'Index of MSME schemes, CGTMSE collateral-free loans, Udyam registration benefits, and technology up-gradation assistance.',
    stats: [
      { label: 'CGTMSE Limit', value: 'Up to ₹2 Cr' },
      { label: 'Udyam Benefit', value: 'Instant' },
      { label: 'Subsidy Rates', value: '15%-35%' },
    ]
  }
};

export default function DynamicSectorHubPage({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = use(params);

  const sectorKey = sector?.toLowerCase() || 'student';
  const config = SECTOR_MAP[sectorKey] || SECTOR_MAP['student'];
  const Icon = config.icon;

  const [schemes, setSchemes] = useState<SchemeCardType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    api.getSchemes({
      category: config.categorySlug,
      pageSize: 30,
      activeOnly: true,
    })
      .then((res) => {
        if (!isCurrent) return;
        setSchemes(res.schemes || []);
      })
      .catch(err => console.error('Sector load error:', err))
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => { isCurrent = false; };
  }, [config.categorySlug]);

  const filteredSchemes = schemes.filter(s => 
    !searchQuery || 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.ministry && s.ministry.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.category_name && s.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-7xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Top Breadcrumb */}
      <Link 
        href="/hubs" 
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B52] hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>All Sector Hubs</span>
      </Link>

      {/* Sector Hero Header */}
      <div className="p-6 sm:p-10 rounded-3xl border border-[#E5E9E3] relative overflow-hidden bg-white shadow-xs">
        <div className="space-y-4 max-w-3xl">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5 ${config.badgeBg}`}>
              <Icon className="h-3.5 w-3.5" />
              <span>{config.badge}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#176B52] bg-[#E7F3EC] px-2.5 py-1 rounded-full border border-[#176B52]/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Government Schemes</span>
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#202820]">
            {config.title}
          </h1>

          <p className="text-xs sm:text-sm text-[#687368] leading-relaxed">
            {config.description}
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-2 max-w-md">
            {config.stats.map((st, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-[#F7F8F5] border border-[#E5E9E3]">
                <div className="font-heading text-sm sm:text-base font-bold text-[#202820]">{st.value}</div>
                <div className="text-[10px] uppercase font-bold text-[#687368] tracking-wider mt-0.5">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#E5E9E3] pb-4">
        <h2 className="font-heading text-xl font-bold text-[#202820]">
          Sector Schemes ({filteredSchemes.length})
        </h2>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A968A]" />
          <input
            type="text"
            placeholder={`Filter ${config.title.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[#E5E9E3] text-[#202820] placeholder-[#8A968A] focus:border-[#176B52] focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {filteredSchemes.map((scheme) => (
          <SchemeCard 
            key={scheme.id} 
            scheme={{ ...scheme, match_score: 1.0, rules_matched: 0, rules_total: 0 }} 
            isMatchedView={false} 
          />
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-44 rounded-2xl bg-white border border-[#E5E9E3] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && filteredSchemes.length === 0 && (
        <div className="p-12 text-center space-y-3 rounded-3xl border border-[#E5E9E3] bg-white max-w-md mx-auto shadow-xs">
          <p className="text-sm font-bold text-[#202820]">No schemes found matching search in this hub.</p>
          <p className="text-xs text-[#687368]">Try clearing your search query or browse all central schemes.</p>
          <Link 
            href="/schemes" 
            className="inline-block px-4 py-2 bg-[#176B52] hover:bg-[#124C3D] text-white rounded-xl text-xs font-semibold mt-2 shadow-xs transition-all"
          >
            Browse All Schemes
          </Link>
        </div>
      )}

      {/* Floating Compare Bar */}
      <CompareFloatingBar />
    </div>
  );
}
