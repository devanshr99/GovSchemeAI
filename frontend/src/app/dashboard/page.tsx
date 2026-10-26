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
  Scale, 
  Clock, 
  ShieldCheck, 
  FileCheck2,
  FolderOpen
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
      
      {/* Title Header (WorkflowPro Greeting Style) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5E9E3] pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3EC] text-xs font-semibold text-[#176B52]">
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Citizen Workspace</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#202820]">
            Welcome to Your Citizen Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#687368]">
            Your centralized portal for saved welfare programs, qualification parameters, and application progress.
          </p>
        </div>

        <Link
          href="/eligibility"
          className="px-5 py-2.5 bg-[#176B52] hover:bg-[#124C3D] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-[#E8A126]" />
          <span>Update Citizen Profile</span>
        </Link>
      </div>

      {/* Metric Cards Row (Inspired by Reference Image 3: WorkflowPro Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E5E9E3] shadow-xs space-y-1">
          <span className="text-xs font-medium text-[#687368] block">Saved Schemes</span>
          <div className="font-heading text-3xl font-bold text-[#202820]">{savedSchemes.length}</div>
          <span className="text-[11px] text-[#176B52] font-medium block pt-1">Active Bookmarks</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E9E3] shadow-xs space-y-1">
          <span className="text-xs font-medium text-[#687368] block">Profile Status</span>
          <div className="font-heading text-2xl font-bold text-[#176B52]">
            {profile ? 'Configured' : 'Pending'}
          </div>
          <span className="text-[11px] text-[#687368] font-medium block pt-1">
            {profile ? `${profile.state} Citizen` : 'Run 60s scan'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E9E3] shadow-xs space-y-1">
          <span className="text-xs font-medium text-[#687368] block">Compare Tray</span>
          <div className="font-heading text-3xl font-bold text-[#202820]">{compareCount}</div>
          <span className="text-[11px] text-[#687368] font-medium block pt-1">Max 3 schemes</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E9E3] shadow-xs space-y-1">
          <span className="text-xs font-medium text-[#687368] block">Data Source</span>
          <div className="font-heading text-2xl font-bold text-[#176B52]">100% Direct</div>
          <span className="text-[11px] text-[#687368] font-medium block pt-1">Gov.in official portals</span>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 sm:p-7 rounded-3xl border border-[#E5E9E3] grid grid-cols-1 md:grid-cols-3 gap-6 bg-white shadow-xs">
        
        {/* Profile Criteria */}
        <div className="space-y-3 border-b md:border-b-0 md:border-r border-[#E5E9E3] pb-5 md:pb-0 md:pr-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#176B52] uppercase tracking-wider">
              <User className="h-4 w-4" />
              <span>Active Citizen Profile</span>
            </div>
            {profile && (
              <span className="text-[10px] text-[#176B52] bg-[#E7F3EC] px-2 py-0.5 rounded-full border border-[#176B52]/20 font-bold">
                Active
              </span>
            )}
          </div>

          {profile ? (
            <div className="space-y-2 text-xs text-[#202820]">
              <p className="flex items-center justify-between border-b border-[#E5E9E3] pb-1.5">
                <span className="text-[#687368]">Age & Gender:</span>
                <strong className="text-[#202820] font-semibold">{profile.age} yrs • {profile.gender}</strong>
              </p>
              <p className="flex items-center justify-between border-b border-[#E5E9E3] pb-1.5">
                <span className="text-[#687368]">State / Region:</span>
                <strong className="text-[#202820] font-semibold">{profile.state} {profile.district ? `(${profile.district})` : ''}</strong>
              </p>
              <p className="flex items-center justify-between border-b border-[#E5E9E3] pb-1.5">
                <span className="text-[#687368]">Occupation:</span>
                <strong className="text-[#202820] font-semibold capitalize">{profile.occupation}</strong>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-[#687368]">Annual Income:</span>
                <strong className="text-[#176B52] font-bold">₹{profile.annual_income?.toLocaleString('en-IN')}/yr</strong>
              </p>
            </div>
          ) : (
            <div className="text-xs text-[#687368] space-y-3 py-1">
              <p>No demographic criteria evaluated yet. Run a quick check to save your criteria locally.</p>
              <Link 
                href="/eligibility" 
                className="inline-flex items-center gap-1.5 text-xs text-[#176B52] font-semibold hover:underline"
              >
                <span>Run 60s Check</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Saved Count */}
        <div className="space-y-3 border-b md:border-b-0 md:border-r border-[#E5E9E3] pb-5 md:pb-0 md:pr-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#E8A126] uppercase tracking-wider">
              <Bookmark className="h-4 w-4" />
              <span>Saved Schemes</span>
            </div>
            <span className="text-xs text-[#687368]">{savedSchemes.length} bookmarked</span>
          </div>
          
          <div className="font-heading text-4xl font-bold text-[#202820]">
            {savedSchemes.length}
          </div>
          <p className="text-xs text-[#687368] leading-relaxed">
            Schemes bookmarked for your application checklist, deadline tracking, and document verification.
          </p>

          {compareCount > 0 && (
            <div className="pt-1">
              <Link
                href="/compare"
                className="inline-flex items-center gap-1 text-xs text-[#176B52] hover:text-[#124C3D] font-semibold hover:underline"
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
            <div className="flex items-center gap-2 text-xs font-bold text-[#176B52] uppercase tracking-wider">
              <Bot className="h-4 w-4" />
              <span>Scheme Advisor AI</span>
            </div>
            <p className="text-xs text-[#687368] leading-relaxed">
              Consult the AI Advisor anytime regarding eligibility criteria, required documents, or step-by-step application instructions.
            </p>
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E7F3EC] hover:bg-[#DDE9DF] text-[#176B52] text-xs font-semibold transition-all border border-[#176B52]/20"
          >
            <Bot className="h-4 w-4" />
            <span>Launch Citizen Advisor AI</span>
          </Link>
        </div>
      </div>

      {/* Saved Schemes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E9E3] pb-3">
          <h2 className="font-heading text-xl font-bold text-[#202820] flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-[#E8A126]" />
            <span>Saved Government Schemes ({savedSchemes.length})</span>
          </h2>
          {savedSchemes.length > 0 && (
            <button
              type="button"
              onClick={clearBookmarks}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Saved List</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-44 rounded-2xl bg-white border border-[#E5E9E3] animate-pulse" />
            <div className="h-44 rounded-2xl bg-white border border-[#E5E9E3] animate-pulse" />
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
          <div className="rounded-3xl p-10 text-center space-y-4 border border-[#E5E9E3] bg-white max-w-lg mx-auto shadow-xs">
            <Bookmark className="h-8 w-8 text-[#8A968A] mx-auto" />
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-[#202820]">No Bookmarked Schemes</h3>
              <p className="text-xs text-[#687368]">
                Click the bookmark icon on any scheme card while browsing to save it for quick access here.
              </p>
            </div>
            <Link
              href="/schemes"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#176B52] hover:bg-[#124C3D] text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
            >
              <span>Browse All Government Schemes</span>
            </Link>
          </div>
        )}
      </div>

      {/* Recently Viewed Schemes Section */}
      {recentlyViewedSchemes.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[#E5E9E3] pb-3">
            <h2 className="font-heading text-lg font-bold text-[#202820] flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-[#176B52]" />
              <span>Recently Viewed Schemes</span>
            </h2>
            <Link href="/schemes" className="text-xs text-[#176B52] font-semibold hover:underline">
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
        <div className="flex items-center justify-between border-b border-[#E5E9E3] pb-3">
          <h2 className="font-heading text-lg font-bold text-[#202820] flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-[#E8A126]" />
            <span>Featured National Welfare Programs</span>
          </h2>
          <Link href="/schemes" className="text-xs text-[#176B52] font-semibold hover:underline">
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
