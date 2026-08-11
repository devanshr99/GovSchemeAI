'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import { SchemeCard as SchemeCardType } from '../../types/scheme';
import Link from 'next/link';
import { 
  LayoutDashboard, Bookmark, User, Clock, Bell, Sparkles, 
  ArrowRight, ShieldCheck, Trash2, Bot, PlusCircle
} from 'lucide-react';

export default function CitizenDashboard() {
  const { profile, language, t } = useApp();
  const [savedSchemes, setSavedSchemes] = useState<SchemeCardType[]>([]);
  const [recommendedSchemes, setRecommendedSchemes] = useState<SchemeCardType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load saved bookmarks from localStorage
    const savedSlugs: string[] = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]') 
      : [];

    api.getSchemes({ pageSize: 30, activeOnly: true })
      .then((res) => {
        if (res.schemes) {
          const bookmarked = res.schemes.filter(s => savedSlugs.includes(s.slug));
          setSavedSchemes(bookmarked);

          // Take top 4 items as general recommended schemes
          setRecommendedSchemes(res.schemes.slice(0, 4));
        }
      })
      .catch(err => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const clearBookmarks = () => {
    localStorage.removeItem('govscheme_bookmarks');
    setSavedSchemes([]);
  };

  return (
    <div className="mx-auto max-w-6xl w-full py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#242832] pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#A855F7] uppercase tracking-wider">
            <LayoutDashboard className="h-4 w-4" />
            <span>Citizen Workspace</span>
          </div>
          <h1 className="text-3xl font-black text-[#F5F5F7]">
            Citizen Dashboard
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            Manage saved benefits, check deadline alerts, and review your eligibility profile.
          </p>
        </div>

        <Link
          href="/eligibility"
          className="px-5 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-extrabold shadow-lg shadow-[#8B5CF6]/20 transition-all flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Update Search Profile
        </Link>
      </div>

      {/* Profile Overview Card */}
      <div className="gov-card p-6 rounded-3xl border-[#242832] grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0D0F14]">
        
        <div className="space-y-2 border-b md:border-b-0 md:border-r border-[#242832] pb-4 md:pb-0 md:pr-6">
          <div className="flex items-center gap-2 text-xs font-bold text-[#A855F7]">
            <User className="h-4 w-4" />
            <span>Profile Criteria</span>
          </div>
          {profile ? (
            <div className="space-y-1 text-xs text-[#A1A1AA]">
              <p><strong className="text-[#F5F5F7]">Age:</strong> {profile.age} years ({profile.gender})</p>
              <p><strong className="text-[#F5F5F7]">State:</strong> {profile.state} {profile.district ? `(${profile.district})` : ''}</p>
              <p><strong className="text-[#F5F5F7]">Occupation:</strong> {profile.occupation}</p>
              <p><strong className="text-[#F5F5F7]">Annual Income:</strong> ₹{profile.annual_income?.toLocaleString('en-IN')}</p>
            </div>
          ) : (
            <div className="text-xs text-[#71717A] space-y-2">
              <p>No profile scan run yet.</p>
              <Link href="/eligibility" className="text-[#A855F7] font-bold hover:underline block">Run Profile Check →</Link>
            </div>
          )}
        </div>

        <div className="space-y-2 border-b md:border-b-0 md:border-r border-[#242832] pb-4 md:pb-0 md:pr-6">
          <div className="flex items-center gap-2 text-xs font-bold text-[#22C55E]">
            <Bookmark className="h-4 w-4" />
            <span>Saved Opportunities</span>
          </div>
          <div className="text-2xl font-black text-[#F5F5F7]">
            {savedSchemes.length}
          </div>
          <p className="text-xs text-[#71717A]">
            Schemes bookmarked for future official portal application.
          </p>
        </div>

        <div className="space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#06B6D4]">
              <Bot className="h-4 w-4" />
              <span>Advisor AI Assistant</span>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Ask Citizen Scheme Advisor about document checklists or helpline numbers.
            </p>
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A855F7] hover:underline pt-2"
          >
            <span>Open Scheme Advisor AI</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Saved Schemes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#242832] pb-3">
          <h2 className="text-lg font-black text-[#F5F5F7] flex items-center gap-2">
            <Bookmark className="h-4.5 w-4.5 text-[#A855F7]" />
            Saved Government Schemes ({savedSchemes.length})
          </h2>
          {savedSchemes.length > 0 && (
            <button
              onClick={clearBookmarks}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Saved List
            </button>
          )}
        </div>

        {savedSchemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedSchemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={{ ...scheme, match_score: 1.0 } as any} isMatchedView={false} />
            ))}
          </div>
        ) : (
          <div className="gov-card rounded-2xl p-10 text-center space-y-4 border-[#242832]">
            <Bookmark className="h-8 w-8 text-[#71717A] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#F5F5F7]">No Bookmarked Schemes</h3>
              <p className="text-xs text-[#A1A1AA]">
                Click the bookmark icon on any scheme card to pin it to your dashboard.
              </p>
            </div>
            <Link
              href="/schemes"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#101217] border border-[#242832] text-[#F5F5F7] rounded-xl text-xs font-bold hover:bg-[#141720]"
            >
              Browse Available Schemes
            </Link>
          </div>
        )}
      </div>

      {/* Recommended Schemes Section */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between border-b border-[#242832] pb-3">
          <h2 className="text-lg font-black text-[#F5F5F7] flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-[#06B6D4]" />
            Recommended Government Programs
          </h2>
          <Link href="/schemes" className="text-xs text-[#A855F7] font-bold hover:underline">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendedSchemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={{ ...scheme, match_score: 1.0 } as any} isMatchedView={false} />
          ))}
        </div>
      </div>
    </div>
  );
}
