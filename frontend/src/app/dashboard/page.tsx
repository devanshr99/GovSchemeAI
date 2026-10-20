'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import { SchemeCard as SchemeCardType } from '../../types/scheme';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Bookmark, 
  User, 
  Sparkles, 
  ArrowRight, 
  Trash2, 
  Bot,
  MapPin,
  IndianRupee,
  Briefcase
} from 'lucide-react';

export default function CitizenDashboard() {
  const { profile } = useApp();
  const [savedSchemes, setSavedSchemes] = useState<SchemeCardType[]>([]);
  const [recommendedSchemes, setRecommendedSchemes] = useState<SchemeCardType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCurrent = true;
    const fetchDashboardSchemes = () => {
      const savedSlugs: string[] = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]') 
        : [];

      api.getSchemes({ pageSize: 30, activeOnly: true })
        .then((res) => {
          if (!isCurrent) return;
          if (res.schemes) {
            const bookmarked = res.schemes.filter(s => savedSlugs.includes(s.slug));
            setSavedSchemes(bookmarked);

            // Take top 4 items as general recommended schemes
            setRecommendedSchemes(res.schemes.slice(0, 4));
          }
        })
        .catch(err => console.error('Dashboard load error:', err))
        .finally(() => {
          if (isCurrent) setLoading(false);
        });
    };

    fetchDashboardSchemes();

    const handleStorage = () => {
      if (typeof window !== 'undefined') {
        try {
          const savedSlugs: string[] = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
          setSavedSchemes(prev => prev.filter(s => savedSlugs.includes(s.slug)));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 1500);

    return () => {
      isCurrent = false;
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const clearBookmarks = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('govscheme_bookmarks');
    }
    setSavedSchemes([]);
  };

  return (
    <div className="mx-auto max-w-7xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
            <LayoutDashboard className="h-4 w-4" />
            <span>Citizen Workspace</span>
          </div>
          <h1 className="font-heading text-3xl font-black text-slate-100">
            Citizen Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage saved benefits, review active demographic profiles, and access personalized advisor assistance.
          </p>
        </div>

        <Link
          href="/eligibility"
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          <span>Update Search Profile</span>
        </Link>
      </div>

      {/* Profile Overview Card */}
      <div className="gov-card p-6 sm:p-7 rounded-3xl border border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0E1017]">
        
        {/* Profile Criteria */}
        <div className="space-y-2.5 border-b md:border-b-0 md:border-r border-white/[0.06] pb-4 md:pb-0 md:pr-6">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
            <User className="h-4 w-4" />
            <span>Active Citizen Profile</span>
          </div>
          {profile ? (
            <div className="space-y-1.5 text-xs text-slate-300">
              <p className="flex items-center gap-1.5">
                <span className="text-slate-400">Age:</span>
                <strong className="text-slate-100">{profile.age} years ({profile.gender})</strong>
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-slate-400">Location:</span>
                <strong className="text-slate-100">{profile.state} {profile.district ? `(${profile.district})` : ''}</strong>
              </p>
              <p className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-slate-400">Occupation:</span>
                <strong className="text-slate-100 capitalize">{profile.occupation}</strong>
              </p>
              <p className="flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-slate-400">Annual Income:</span>
                <strong className="text-emerald-400">₹{profile.annual_income?.toLocaleString('en-IN')}/yr</strong>
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-400 space-y-2">
              <p>No profile scan run yet.</p>
              <Link href="/eligibility" className="text-purple-400 font-bold hover:underline block">
                Run Profile Check →
              </Link>
            </div>
          )}
        </div>

        {/* Saved Count */}
        <div className="space-y-2 border-b md:border-b-0 md:border-r border-white/[0.06] pb-4 md:pb-0 md:pr-6">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Bookmark className="h-4 w-4" />
            <span>Saved Opportunities</span>
          </div>
          <div className="font-heading text-3xl font-black text-slate-100">
            {savedSchemes.length}
          </div>
          <p className="text-xs text-slate-400">
            Government schemes bookmarked for future reference and application.
          </p>
        </div>

        {/* Advisor Assistant Quick Link */}
        <div className="space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Bot className="h-4 w-4" />
              <span>Citizen Advisor AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consult the Scheme Advisor about document checklists, helplines, or step-by-step submission questions.
            </p>
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors pt-2"
          >
            <span>Launch Scheme Advisor AI</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Saved Schemes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <h2 className="font-heading text-lg font-bold text-slate-100 flex items-center gap-2">
            <Bookmark className="h-4.5 w-4.5 text-purple-400" />
            <span>Saved Government Schemes ({savedSchemes.length})</span>
          </h2>
          {savedSchemes.length > 0 && (
            <button
              type="button"
              onClick={clearBookmarks}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Saved List</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="gov-card h-44 rounded-2xl skeleton-shimmer opacity-40 border border-white/[0.08]" />
            <div className="gov-card h-44 rounded-2xl skeleton-shimmer opacity-40 border border-white/[0.08]" />
          </div>
        ) : savedSchemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedSchemes.map((scheme) => (
              <SchemeCard 
                key={scheme.id} 
                scheme={{ ...scheme, match_score: 1.0, rules_matched: 0, rules_total: 0 }} 
                isMatchedView={false} 
              />
            ))}
          </div>
        ) : (
          <div className="gov-card rounded-2xl p-10 text-center space-y-4 border border-white/[0.08]">
            <Bookmark className="h-8 w-8 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-slate-200">No Bookmarked Schemes</h3>
              <p className="text-xs text-slate-400">
                Click the bookmark icon on any scheme card to save it for quick access here.
              </p>
            </div>
            <Link
              href="/schemes"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0E1017] hover:bg-[#161924] border border-white/[0.08] text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              <span>Browse Schemes Catalog</span>
            </Link>
          </div>
        )}
      </div>

      {/* Recommended Schemes Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <h2 className="font-heading text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-cyan-400" />
            <span>Recommended Government Programs</span>
          </h2>
          <Link href="/schemes" className="text-xs text-purple-400 font-bold hover:underline">
            View All Schemes →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendedSchemes.map((scheme) => (
            <SchemeCard 
              key={scheme.id} 
              scheme={{ ...scheme, match_score: 1.0, rules_matched: 0, rules_total: 0 }} 
              isMatchedView={false} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
