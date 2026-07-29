'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import { COMPREHENSIVE_SCHEMES } from '../../data/comprehensiveSchemes';
import { SchemeDetail } from '../../types/scheme';
import Link from 'next/link';
import {
  User, Bookmark, Clock, ShieldCheck, FileCheck, Calendar,
  Sparkles, CheckCircle2, ArrowRight, RefreshCw, Landmark, AlertCircle
} from 'lucide-react';

export default function CitizenDashboard() {
  const { profile, results, t } = useApp();
  const [savedSchemes, setSavedSchemes] = useState<SchemeDetail[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<SchemeDetail[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSlugs: string[] = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
      const saved = COMPREHENSIVE_SCHEMES.filter((s) => savedSlugs.includes(s.slug));
      setSavedSchemes(saved);

      const recentItems: SchemeDetail[] = JSON.parse(localStorage.getItem('govscheme_recently_viewed') || '[]');
      setRecentlyViewed(recentItems.slice(0, 4));
    }
  }, []);

  const profileData = profile || api.getProfileFromStorage() || {
    age: 24,
    gender: 'male',
    state: 'UP',
    occupation: 'Student',
    annual_income: 180000,
    category: 'obc',
    disability: false,
    is_student: true,
    is_farmer: false,
    is_woman: false,
    is_senior_citizen: false,
    is_bpl: true,
    language: 'en'
  };

  const documentChecklist = [
    { name: "Aadhaar Card (Linked to Mobile)", status: "verified", desc: "Required for DBT direct bank transfer" },
    { name: "Family Income Certificate", status: "verified", desc: "Issued by Tehsildar / Revenue Department" },
    { name: "Domicile / Residence Certificate", status: "verified", desc: "Proves state eligibility" },
    { name: "Category / Caste Certificate", status: "pending", desc: "OBC/SC/ST non-creamy layer validation" },
    { name: "Active Bank Account Passbook", status: "verified", desc: "e-KYC verified bank account" },
  ];

  return (
    <div className="mx-auto max-w-6xl w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      {/* Top Banner */}
      <div className="gov-card p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-amber-500 absolute top-0 left-0 right-0" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-[11px] font-extrabold text-blue-300 uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>National Citizen Portal • Verified Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2">
              Citizen Portal Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Manage saved schemes, eligibility checks, document readiness, and deadline alerts in one place.
            </p>
          </div>

          <div className="px-5 py-3 bg-slate-900 border border-white/10 rounded-2xl shrink-0 text-left">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Citizen Identity Profile</div>
            <div className="text-sm font-black text-blue-400 mt-0.5">{profileData.occupation} • {profileData.state}</div>
            <div className="text-[11px] text-slate-300 font-medium mt-0.5">Income: ₹{profileData.annual_income.toLocaleString()} / year</div>
          </div>
        </div>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="gov-card p-4 rounded-2xl border border-white/[0.08] space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Saved Schemes</span>
            <Bookmark className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">{savedSchemes.length}</div>
        </div>

        <div className="gov-card p-4 rounded-2xl border border-white/[0.08] space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Eligibility Scan Score</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {results ? `${results.eligible_count} Eligible` : '96% Ready'}
          </div>
        </div>

        <div className="gov-card p-4 rounded-2xl border border-white/[0.08] space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Verified Documents</span>
            <FileCheck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">4 / 5 Ready</div>
        </div>

        <div className="gov-card p-4 rounded-2xl border border-white/[0.08] space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Upcoming Deadlines</span>
            <Calendar className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">2 Active</div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Saved Schemes & Recommendations */}
        <div className="lg:col-span-2 space-y-8">
          {/* Saved Bookmarks */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-blue-400" />
                Saved Schemes ({savedSchemes.length})
              </h2>
              <Link href="/schemes" className="text-xs text-blue-400 hover:underline font-semibold flex items-center gap-1">
                Browse Schemes <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {savedSchemes.length > 0 ? (
              savedSchemes.map((scheme) => (
                <SchemeCard
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
              <div className="gov-card p-8 rounded-2xl text-center space-y-3 border border-white/[0.08]">
                <Bookmark className="h-8 w-8 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-200">No Saved Schemes Yet</h3>
                <p className="text-xs text-slate-400">Click the bookmark icon on any scheme card to save it here for quick access.</p>
              </div>
            )}
          </div>

          {/* AI Recommended Schemes */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Top Recommended Opportunities for You
            </h2>

            {COMPREHENSIVE_SCHEMES.slice(0, 3).map((scheme) => (
              <SchemeCard
                key={`rec-${scheme.id}`}
                scheme={{
                  ...scheme,
                  match_score: 0.95,
                  rules_matched: 3,
                  rules_total: 3,
                } as any}
                isMatchedView={true}
              />
            ))}
          </div>
        </div>

        {/* Right 1 Col: Documents Checklist & Upcoming Deadlines */}
        <div className="space-y-6">
          {/* Document Verification Readiness */}
          <div className="gov-card p-5 rounded-2xl border border-white/[0.08] space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <FileCheck className="h-4 w-4 text-emerald-400" />
              Document Readiness Checklist
            </h3>

            <div className="space-y-3">
              {documentChecklist.map((doc, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-white/[0.06]">
                  <div>
                    <div className="font-bold text-slate-200">{doc.name}</div>
                    <div className="text-[10px] text-slate-400">{doc.desc}</div>
                  </div>
                  {doc.status === 'verified' ? (
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 shrink-0">
                      Verified
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-500/30 shrink-0">
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Application Deadlines */}
          <div className="gov-card p-5 rounded-2xl border border-white/[0.08] space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <Calendar className="h-4 w-4 text-cyan-400" />
              Upcoming Deadlines Alert
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">National Scholarship (NMMSS)</span>
                  <span className="text-[10px] font-bold text-cyan-400">Oct 31, 2026</span>
                </div>
                <p className="text-[10px] text-slate-400">NSP Portal Online Application Deadline</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">PM Internship Scheme</span>
                  <span className="text-[10px] font-bold text-amber-400">Nov 15, 2026</span>
                </div>
                <p className="text-[10px] text-slate-400">Company Selection Window Closes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
