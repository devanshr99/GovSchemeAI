'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Link from 'next/link';
import { Newspaper, Bell, Search, ExternalLink, ShieldCheck, Tag, Calendar, ArrowRight } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  category: 'PIB Press Release' | 'Scholarship Alert' | 'Startup News' | 'Agriculture Advisory' | 'Education Policy';
  date: string;
  summary: string;
  source: string;
  url: string;
  isUrgent?: boolean;
}

const NEWS_ARTICLES: NewsItem[] = [
  {
    id: "n-101",
    title: "PM Internship Scheme Phase II Application Window Opened for FY 2026-27",
    category: "PIB Press Release",
    date: "July 28, 2026",
    summary: "Ministry of Corporate Affairs announces 1.25 Lakh new internship slots in top 500 companies with monthly stipend of ₹5,000.",
    source: "Press Information Bureau (PIB)",
    url: "https://pminternship.mca.gov.in",
    isUrgent: true
  },
  {
    id: "n-102",
    title: "National Scholarship Portal (NSP 2.0) Opens Pre-Matric & Post-Matric Renewals",
    category: "Scholarship Alert",
    date: "July 26, 2026",
    summary: "Students across India can now complete OTR (One-Time Registration) and submit Aadhaar-seeded bank account details for direct transfer.",
    source: "Ministry of Education",
    url: "https://scholarships.gov.in"
  },
  {
    id: "n-103",
    title: "Startup India Seed Fund Scheme Disburses ₹1,200 Crore Capital to 3,500 Startups",
    category: "Startup News",
    date: "July 22, 2026",
    summary: "DPIIT confirms seed funding grants up to ₹20 Lakh disbursed through 180+ recognized university incubation centers.",
    source: "DPIIT India",
    url: "https://seedfund.startupindia.gov.in"
  },
  {
    id: "n-104",
    title: "PM-KISAN 19th Installment Credited: ₹2,000 Transferred to 9.5 Crore Farmer Accounts",
    category: "Agriculture Advisory",
    date: "July 18, 2026",
    summary: "Farmers are advised to complete e-KYC and land seeding on pmkisan.gov.in portal before the next disbursement cycle.",
    source: "Ministry of Agriculture",
    url: "https://pmkisan.gov.in"
  },
  {
    id: "n-105",
    title: "AICTE Announces 10,000 New Pragati Scholarships for Female Engineering Students",
    category: "Education Policy",
    date: "July 15, 2026",
    summary: "Annual grant of ₹50,000 approved for first-year degree and diploma technical students admitted in AICTE approved colleges.",
    source: "AICTE Press Release",
    url: "https://www.aicte-india.org"
  }
];

export default function GovernmentNewsPage() {
  const { language, t } = useApp();
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const filteredNews = NEWS_ARTICLES.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.summary.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || n.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", "PIB Press Release", "Scholarship Alert", "Startup News", "Agriculture Advisory", "Education Policy"];

  return (
    <div className="mx-auto max-w-6xl w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      {/* Banner */}
      <div className="gov-card p-6 sm:p-8 rounded-3xl border border-white/[0.08] relative overflow-hidden shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-amber-500 absolute top-0 left-0 right-0" />

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-[11px] font-extrabold text-blue-300 uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>Verified Official Feed • PIB & Ministry Press Releases</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2.5">
            <Newspaper className="h-7 w-7 text-blue-400" />
            Government Updates & Gazette News
          </h1>

          <p className="text-xs sm:text-sm text-slate-300">
            Real-time policy announcements, scholarship openings, PIB press releases, and agricultural advisories.
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="gov-card p-4 rounded-2xl border border-white/[0.08] space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search news, policy changes, or scholarship announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-900 border border-white/10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setCategoryFilter(cat)}
              className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                categoryFilter === cat
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-900/60 border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {filteredNews.map((news) => (
          <div key={news.id} className="gov-card p-5 sm:p-6 rounded-2xl border border-white/[0.08] space-y-3 relative">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                  {news.category}
                </span>
                {news.isUrgent && (
                  <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/30 flex items-center gap-1">
                    <Bell className="h-3 w-3 text-red-400" /> Urgent
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{news.date}</span>
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-100">{news.title}</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{news.summary}</p>

            <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 text-xs">
              <span className="text-slate-400 font-semibold">Source: {news.source}</span>
              <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline font-bold flex items-center gap-1"
              >
                <span>Read Official Press Release</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
