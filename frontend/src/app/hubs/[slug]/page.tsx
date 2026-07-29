'use client';

import React, { useState, useEffect, use } from 'react';
import { useApp } from '../../../context/AppContext';
import { SchemeCard as SchemeCardComponent } from '../../../components/schemes/SchemeCard';
import { COMPREHENSIVE_SCHEMES } from '../../../data/comprehensiveSchemes';
import { SchemeDetail } from '../../../types/scheme';
import Link from 'next/link';
import {
  GraduationCap, Rocket, Tractor, HeartHandshake, Briefcase,
  Search, Filter, ShieldCheck, ArrowRight, BookOpen, Landmark, Sparkles
} from 'lucide-react';

interface HubConfig {
  title: string;
  titleHi: string;
  badge: string;
  icon: React.ReactNode;
  accentColor: string;
  description: string;
  quickTags: string[];
  industries?: string[];
  stages?: string[];
}

const HUB_CONFIGS: Record<string, HubConfig> = {
  student: {
    title: "National Student & Scholarship Hub",
    titleHi: "राष्ट्रीय छात्र एवं छात्रवृत्ति हब",
    badge: "Scholarships & Fellowships",
    icon: <GraduationCap className="h-7 w-7 text-blue-400" />,
    accentColor: "from-blue-600 to-indigo-600",
    description: "Discover Central & State scholarships, PM Internship Opportunities, AICTE/UGC research fellowships, and free coaching schemes for Indian students.",
    quickTags: ["Scholarships", "NSP Integration", "PM Internship", "AICTE Grants", "Engineering", "Medical", "Free Coaching", "Laptops & Tablets"]
  },
  startup: {
    title: "Startup & Entrepreneurship Hub",
    titleHi: "स्टार्टअप एवं उद्यमिता हब",
    badge: "Grants & Seed Capital",
    icon: <Rocket className="h-7 w-7 text-amber-400" />,
    accentColor: "from-amber-600 to-orange-600",
    description: "Access Startup India Seed Funds, DPIIT Tax Exemptions, Stand-Up India credit lines, Mudra loans, PMEGP capital subsidies, and incubation grants.",
    quickTags: ["Startup India", "DPIIT Benefits", "Seed Fund", "Stand-Up India", "PMEGP", "Mudra Loan", "Incubation", "Women Startups"],
    industries: ["All Tech Sectors", "Manufacturing", "AgriTech", "FinTech", "HealthTech", "CleanTech"],
    stages: ["Idea / Prototype", "Proof of Concept", "Early Traction", "Scaling & Growth"]
  },
  farmer: {
    title: "Kisan Welfare & Agriculture Hub",
    titleHi: "किसान कल्याण एवं कृषि हब",
    badge: "PM-KISAN & Subsidies",
    icon: <Tractor className="h-7 w-7 text-emerald-400" />,
    accentColor: "from-emerald-600 to-teal-600",
    description: "Direct income support under PM-KISAN, crop insurance (PMFBY), Kisan Credit Cards (KCC), farm machinery subsidies, and irrigation grants.",
    quickTags: ["PM-KISAN", "Crop Insurance", "Soil Health Card", "Kisan Credit Card", "Irrigation", "Farm Machinery", "Dairy & Fisheries"]
  },
  women: {
    title: "Women Empowerment & Nari Shakti Hub",
    titleHi: "नारी शक्ति एवं महिला सशक्तिकरण हब",
    badge: "SHG & Micro-Credit",
    icon: <HeartHandshake className="h-7 w-7 text-pink-400" />,
    accentColor: "from-pink-600 to-rose-600",
    description: "Empowering women with Lakhpati Didi SHG loans, maternity benefits (PMMVY), skill development programs, safety schemes, and financial grants.",
    quickTags: ["Lakhpati Didi", "SHG Credit", "Maternity Benefit", "Girl Child", "Skill Development", "Health & Safety", "Nutrition"]
  },
  youth: {
    title: "Youth, Skills & Employment Hub",
    titleHi: "युवा, कौशल एवं रोजगार हब",
    badge: "PMKVY & Apprenticeships",
    icon: <Briefcase className="h-7 w-7 text-cyan-400" />,
    accentColor: "from-cyan-600 to-blue-600",
    description: "PM Kaushal Vikas Yojana skill certifications, National Apprenticeship stipends (NAPS-2), employment exchange registrations, and career guidance.",
    quickTags: ["Skill India", "PMKVY 4.0", "Apprenticeships", "Corporate Jobs", "Career Guidance", "Vocational Training"]
  }
};

export default function SectorHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { language, t } = useApp();

  const config = HUB_CONFIGS[slug] || HUB_CONFIGS.student;

  const [search, setSearch] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [schemes, setSchemes] = useState<SchemeDetail[]>([]);

  useEffect(() => {
    // Filter comprehensive dataset for this hub
    let filtered = COMPREHENSIVE_SCHEMES.filter(
      (s) => s.hub_category === slug || s.scheme_type.includes(slug) || s.tags.some(t => t.toLowerCase().includes(slug))
    );

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) => s.name.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q)) || s.description?.toLowerCase().includes(q)
      );
    }

    if (selectedTag) {
      filtered = filtered.filter((s) => s.tags.some(t => t.toLowerCase().includes(selectedTag.toLowerCase())));
    }

    if (industryFilter && config.industries) {
      filtered = filtered.filter((s) => !s.industry || s.industry.toLowerCase().includes(industryFilter.toLowerCase()));
    }

    setSchemes(filtered);
  }, [slug, search, selectedTag, industryFilter, stageFilter]);

  return (
    <div className="mx-auto max-w-6xl w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      {/* Hero Banner */}
      <div className="gov-card rounded-3xl p-6 sm:p-10 border border-white/[0.08] relative overflow-hidden shadow-2xl">
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config.accentColor}`} />

        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-[11px] font-extrabold text-blue-300 uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>National Platform • {config.badge}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 shrink-0">
              {config.icon}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
              {language === 'hi' ? config.titleHi : config.title}
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {config.description}
          </p>

          {/* Quick Filter Tag Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => setSelectedTag('')}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                selectedTag === ''
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-900/60 border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              All {config.badge}
            </button>
            {config.quickTags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                  selectedTag === tag
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-900/60 border-white/[0.08] text-slate-300 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Sector Filters Panel */}
      <div className="gov-card p-4 sm:p-5 rounded-2xl border border-white/[0.08] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search in ${config.title}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-900 border border-white/10"
            />
          </div>

          {config.industries && (
            <div className="relative">
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-900 border border-white/10"
              >
                <option value="">Filter by Industry</option>
                {config.industries.map((ind, i) => (
                  <option key={i} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <Landmark className="h-5 w-5 text-blue-400" />
            Verified Opportunities ({schemes.length})
          </h2>
          <span className="text-xs text-slate-400">Official Government Guidelines</span>
        </div>

        {schemes.length > 0 ? (
          schemes.map((scheme) => (
            <SchemeCardComponent
              key={scheme.id}
              scheme={{
                ...scheme,
                match_score: 1.0,
                rules_matched: 0,
                rules_total: 0,
              } as any}
              isMatchedView={false}
            />
          ))
        ) : (
          <div className="gov-card p-10 rounded-2xl text-center space-y-3 border border-white/[0.08]">
            <BookOpen className="h-8 w-8 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-200">No Schemes Found</h3>
            <p className="text-xs text-slate-400">Try clearing search filters or select a different tag.</p>
          </div>
        )}
      </div>
    </div>
  );
}
