'use client';

import React, { useState, useEffect, use } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../lib/api';
import { SchemeCard } from '../../../components/schemes/SchemeCard';
import { SchemeCard as SchemeCardType } from '../../../types/scheme';
import Link from 'next/link';
import { 
  GraduationCap, Rocket, Sprout, HeartHandshake, Briefcase, Building2, 
  ArrowLeft, Search, ShieldCheck 
} from 'lucide-react';

interface SectorConfig {
  title: string;
  categorySlug: string;
  icon: any;
  badge: string;
  subtitle: string;
  description: string;
  stats: { label: string; value: string }[];
}

const SECTOR_MAP: Record<string, SectorConfig> = {
  student: {
    title: 'Student Hub & Scholarships',
    categorySlug: 'education',
    icon: GraduationCap,
    badge: 'Education & Learning Portal',
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
  const { t } = useApp();

  const sectorKey = sector?.toLowerCase() || 'student';
  const config = SECTOR_MAP[sectorKey] || SECTOR_MAP['student'];
  const Icon = config.icon;

  const [schemes, setSchemes] = useState<SchemeCardType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    api.getSchemes({
      category: config.categorySlug,
      pageSize: 20,
      activeOnly: true,
    })
      .then((res) => {
        setSchemes(res.schemes || []);
      })
      .catch(err => console.error('Sector load error:', err))
      .finally(() => setLoading(false));
  }, [config.categorySlug]);

  const filteredSchemes = schemes.filter(s => 
    !searchQuery || 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.ministry && s.ministry.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.category_name && s.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-6xl w-full py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Top Breadcrumb */}
      <Link href="/hubs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A855F7] hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" />
        All Sector Hubs
      </Link>

      {/* Sector Hero Header */}
      <div className="gov-card p-6 sm:p-10 rounded-3xl border-[#242832] relative overflow-hidden bg-gradient-to-br from-[#101217] via-[#141720] to-[#0D0F14]">
        <div className="space-y-4 max-w-3xl">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-lg bg-[#8B5CF6]/15 text-[#A855F7] border border-[#8B5CF6]/30 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {config.badge}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg border border-[#22C55E]/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Schemes
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#F5F5F7]">
            {config.title}
          </h1>

          <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
            {config.description}
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-2 max-w-md">
            {config.stats.map((st, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#0D0F14] border border-[#242832]">
                <div className="text-sm sm:text-base font-bold text-[#F5F5F7]">{st.value}</div>
                <div className="text-[9px] uppercase font-extrabold text-[#71717A] tracking-wider mt-0.5">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#242832] pb-4">
        <h2 className="text-xl font-bold text-[#F5F5F7]">
          Sector Opportunities ({filteredSchemes.length})
        </h2>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#71717A]" />
          <input
            type="text"
            placeholder={`Search ${config.title.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#0D0F14] border border-[#242832] text-[#F5F5F7] placeholder-[#71717A]"
          />
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSchemes.map((scheme) => (
          <SchemeCard key={scheme.id} scheme={{ ...scheme, match_score: 1.0 } as any} isMatchedView={false} />
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="gov-card h-44 rounded-2xl skeleton-shimmer opacity-40" />
          ))}
        </div>
      )}

      {!loading && filteredSchemes.length === 0 && (
        <div className="gov-card p-12 text-center space-y-3 rounded-2xl border-[#242832]">
          <p className="text-sm font-bold text-[#F5F5F7]">No schemes found matching search in this hub.</p>
          <p className="text-xs text-[#A1A1AA]">Try clearing search or browse all central schemes.</p>
          <Link href="/schemes" className="inline-block px-4 py-2 bg-[#8B5CF6] text-white rounded-xl text-xs font-bold mt-2">
            Browse All Schemes
          </Link>
        </div>
      )}
    </div>
  );
}
