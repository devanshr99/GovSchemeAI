'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import { CompareFloatingBar } from '../../components/common/CompareFloatingBar';
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
  Briefcase,
  Scale,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function CitizenDashboard() {
  const { profile } = useApp();
  const [savedSchemes, setSavedSchemes] = useState<SchemeCardType[]>([]);
  const [recommendedSchemes, setRecommendedSchemes] = useState<SchemeCardType[]>([]);
  const [recentlyViewedSchemes, setRecentlyViewedSchemes] = useState<SchemeCardType[]>([]);
  const [compareCount, setCompareCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCurrent = true;

    const loadData = () => {
      const savedSlugs: string[] = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]') 
        : [];
      const compareSlugs: string[] = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('govscheme_compare') || '[]') 
        : [];
      const recentSlugs: string[] = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('govscheme_recently_viewed') || '[]') 
        : [];

      setCompareCount(compareSlugs.length);

      api.getSchemes({ pageSize: 50, activeOnly: true })
        .then((res) => {
          if (!isCurrent) return;
          if (res.schemes) {
            const bookmarked = res.schemes.filter(s => savedSlugs.includes(s.slug));
            setSavedSchemes(bookmarked);

            const recent = res.schemes.filter(s => recentSlugs.includes(s.slug));
            setRecentlyViewedSchemes(recent);

            // Take first 4 items as general recommended schemes
            setRecommendedSchemes(res.schemes.slice(0, 4));
          }
        })
        .catch(err => console.error('Dashboard load error:', err))
        .finally(() => {
          if (isCurrent) setLoading(false);
        });
    };

    loadData();

    const handleStorage = () => {
      if (typeof window !== 'undefined') {
        try {
          const savedSlugs: string[] = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
          const compareSlugs: string[] = JSON.parse(localStorage.getItem('govscheme_compare') || '[]');
          setCompareCount(compareSlugs.length);
          setSavedSchemes(prev => prev.filter(s => savedSlugs.includes(s.slug)));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 2000);

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
    <div className="mx-auto max-w-7xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-10 relative z-10 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Citizen Workspace</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-100">
            Citizen Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Your centralized portal for saved welfare programs, qualification parameters, and application progress.
          </p>
        </div>

        <Link
          href="/eligibility"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          <span>Update Citizen Profile</span>
        </Link>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 sm:p-7 rounded-3xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#111827] shadow-xl">
        
        {/* Profile Criteria */}
        <div className="space-y-3 border-b md:border-b-0 md:border-r border-slate-800/80 pb-5 md:pb-0 md:pr-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <User className="h-4 w-4" />
              <span>Active Citizen Profile</span>
            </div>
            {profile && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                Active
              </span>
            )}
          </div>

          {profile ? (
            <div className="space-y-2 text-xs text-slate-300">
              <p className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Age & Gender:</span>
                <strong className="text-slate-100 font-semibold">{profile.age} yrs • {profile.gender}</strong>
              </p>
              <p className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">State / Region:</span>
                <strong className="text-slate-100 font-semibold">{profile.state} {profile.district ? `(${profile.district})` : ''}</strong>
              </p>
              <p className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Occupation:</span>
                <strong className="text-slate-100 font-semibold capitalize">{profile.occupation}</strong>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-400">Annual Income:</span>
                <strong className="text-emerald-400 font-bold">₹{profile.annual_income?.toLocaleString('en-IN')}/yr</strong>
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-400 space-y-3 py-1">
              <p>No demographic criteria evaluated yet. Run a quick check to save your criteria locally.</p>
              <Link 
                href="/eligibility" 
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-bold hover:underline"
              >
                <span>Run 60s Check</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Saved Count */}
        <div className="space-y-3 border-b md:border-b-0 md:border-r border-slate-800/80 pb-5 md:pb-0 md:pr-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Bookmark className="h-4 w-4" />
              <span>Saved Schemes</span>
            </div>
            <span className="text-xs text-slate-400">{savedSchemes.length} bookmarked</span>
          </div>
          
          <div className="font-heading text-4xl font-black text-slate-100">
            {savedSchemes.length}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Schemes bookmarked for your application checklist, deadline tracking, and document verification.
          </p>

          {compareCount > 0 && (
            <div className="pt-1">
              <Link
                href="/compare"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold hover:underline"
              >
                <Scale className="h-3.5 w-3.5" />
                <span>{compareCount} scheme{compareCount > 1 ? 's' : ''} in comparison tray →</span>
              </Link>
            </div>
          )}
        </div>

        {/* Advisor Assistant Quick Link */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Bot className="h-4 w-4" />
              <span>Scheme Advisor AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consult the AI Advisor anytime regarding eligibility criteria, required documents, or step-by-step application instructions.
            </p>
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-bold transition-all"
          >
            <Bot className="h-4 w-4 text-blue-400" />
            <span>Launch Citizen Advisor AI</span>
          </Link>
        </div>
      </div>

      {/* Saved Schemes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="font-heading text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-amber-400" />
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
            <div className="h-44 rounded-2xl bg-[#111827] border border-slate-800 animate-pulse" />
            <div className="h-44 rounded-2xl bg-[#111827] border border-slate-800 animate-pulse" />
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
          <div className="rounded-3xl p-10 text-center space-y-4 border border-slate-800 bg-[#111827] max-w-lg mx-auto">
            <Bookmark className="h-8 w-8 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-slate-200">No Bookmarked Schemes</h3>
              <p className="text-xs text-slate-400">
                Click the bookmark icon on any scheme card while browsing to save it for quick access here.
              </p>
            </div>
            <Link
              href="/schemes"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
            >
              <span>Browse All Government Schemes</span>
            </Link>
          </div>
        )}
      </div>

      {/* Recently Viewed Schemes Section */}
      {recentlyViewedSchemes.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="font-heading text-lg font-bold text-slate-100 flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-blue-400" />
              <span>Recently Viewed Schemes</span>
            </h2>
            <Link href="/schemes" className="text-xs text-blue-400 font-bold hover:underline">
              Browse All Catalog →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentlyViewedSchemes.slice(0, 4).map((scheme) => (
              <SchemeCard 
                key={scheme.id} 
                scheme={{ ...scheme, match_score: 1.0, rules_matched: 0, rules_total: 0 }} 
                isMatchedView={false} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Schemes Section */}
      <div className="space-y-4 pt-2 pb-16">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="font-heading text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-amber-400" />
            <span>Featured National Welfare Programs</span>
          </h2>
          <Link href="/schemes" className="text-xs text-blue-400 font-bold hover:underline">
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

      {/* Floating Compare Bar */}
      <CompareFloatingBar />
    </div>
  );
}
