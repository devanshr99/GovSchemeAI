'use client';

import React, { useState, useEffect, use } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../lib/api';
import { SchemeDetail } from '../../../types/scheme';
import { Modal } from '../../../components/common/Modal';
import { CompareFloatingBar } from '../../../components/common/CompareFloatingBar';
import Link from 'next/link';
import {
  ArrowLeft, 
  ArrowRight,
  ShieldCheck,
  FileText, 
  Sparkles, 
  ExternalLink, 
  Building2,
  ChevronRight, 
  Share2, 
  Bookmark, 
  BookmarkCheck, 
  Copy, 
  CheckCircle2,
  AlertTriangle, 
  Info,
  Scale,
  Check,
  Bot,
  Award
} from 'lucide-react';

export default function SchemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { language, t } = useApp();

  const [scheme, setScheme] = useState<SchemeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'eligibility' | 'documents' | 'process'>('overview');
  
  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
        return Array.isArray(saved) && saved.includes(slug);
      } catch {
        return false;
      }
    }
    return false;
  });

  // Compare state
  const [isCompared, setIsCompared] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const compares = JSON.parse(localStorage.getItem('govscheme_compare') || '[]');
        return Array.isArray(compares) && compares.includes(slug);
      } catch {
        return false;
      }
    }
    return false;
  });

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userProfileCheck, setUserProfileCheck] = useState<{
    status: 'eligible' | 'not_eligible' | 'not_scanned';
    passedRules: string[];
    failedRules: string[];
  }>({ status: 'not_scanned', passedRules: [], failedRules: [] });

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    setLoading(true);

    api.getSchemeDetail(slug)
      .then(res => {
        if (!isMounted) return;
        setScheme(res);

        // Update recently viewed history in localStorage
        if (typeof window !== 'undefined') {
          try {
            const recent = JSON.parse(localStorage.getItem('govscheme_recently_viewed') || '[]');
            const filtered = recent.filter((r: { slug: string }) => r.slug !== slug);
            const updated = [
              {
                id: res.id,
                slug: res.slug,
                name: res.name,
                name_hi: res.name_hi,
                category_name: res.category_name,
                level: res.level,
                benefits_amount: res.benefits_amount,
              },
              ...filtered,
            ].slice(0, 6);
            localStorage.setItem('govscheme_recently_viewed', JSON.stringify(updated));
          } catch (err) {
            console.warn('Recently viewed storage error:', err);
          }
        }

        // Quick evaluation against stored citizen profile if present
        const profile = api.getProfileFromStorage();
        if (profile && res.id) {
          api.checkEligibility(profile)
            .then(checkRes => {
              const matched = checkRes.schemes.find(s => s.slug === slug);
              if (matched) {
                const passed: string[] = [];
                const failed: string[] = [];
                if (matched.rules_evaluation) {
                  matched.rules_evaluation.forEach(rule => {
                    if (rule.startsWith('✓')) passed.push(rule.replace('✓ ', ''));
                    else if (rule.startsWith('✗')) failed.push(rule.replace('✗ ', ''));
                  });
                }
                setUserProfileCheck({
                  status: failed.length === 0 ? 'eligible' : 'not_eligible',
                  passedRules: passed,
                  failedRules: failed,
                });
              }
            })
            .catch(() => {});
        }
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Scheme detail error:', err);
        setError('Government scheme record not found or temporarily unavailable.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [slug]);

  const toggleBookmark = () => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
      let updated: string[];
      if (saved.includes(slug)) {
        updated = saved.filter((s: string) => s !== slug);
        setIsBookmarked(false);
      } else {
        updated = [...saved, slug];
        setIsBookmarked(true);
      }
      localStorage.setItem('govscheme_bookmarks', JSON.stringify(updated));
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const toggleCompare = () => {
    try {
      const compareList: string[] = JSON.parse(localStorage.getItem('govscheme_compare') || '[]');
      let updated: string[];
      if (compareList.includes(slug)) {
        updated = compareList.filter((s: string) => s !== slug);
        setIsCompared(false);
      } else {
        if (compareList.length >= 3) {
          updated = [...compareList.slice(1), slug];
        } else {
          updated = [...compareList, slug];
        }
        setIsCompared(true);
      }
      localStorage.setItem('govscheme_compare', JSON.stringify(updated));
    } catch (err) {
      console.error('Compare error:', err);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl w-full py-12 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="h-4 w-32 rounded bg-white animate-pulse" />
        <div className="h-10 w-2/3 rounded-xl bg-white animate-pulse" />
        <div className="h-48 w-full rounded-2xl bg-white animate-pulse" />
        <div className="h-96 w-full rounded-2xl bg-white animate-pulse" />
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="mx-auto max-w-md w-full py-20 px-4 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-[#E8A126] mx-auto" />
        <h2 className="font-heading text-xl font-bold text-[#202820]">Scheme Record Unavailable</h2>
        <p className="text-xs text-[#687368]">{error || 'This scheme could not be located in our directory.'}</p>
        <Link
          href="/schemes"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#176B52] hover:bg-[#124C3D] text-white text-xs font-semibold transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Schemes Directory</span>
        </Link>
      </div>
    );
  }

  const isCentral = scheme.level === 'Central' || !scheme.level;
  const displayName = language === 'hi' && scheme.name_hi ? scheme.name_hi : scheme.name;

  return (
    <div className="mx-auto max-w-5xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Floating Compare Tray */}
      <CompareFloatingBar />

      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center gap-2 text-xs text-[#687368]" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#176B52] transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3 text-[#8A968A]" />
        <Link href="/schemes" className="hover:text-[#176B52] transition-colors">Schemes</Link>
        <ChevronRight className="h-3 w-3 text-[#8A968A]" />
        <span className="text-[#202820] font-medium truncate max-w-xs">{scheme.name}</span>
      </nav>

      {/* Main Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E9E3] shadow-xs space-y-5">
        
        {/* Badges Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#E7F3EC] text-[#176B52] border border-[#176B52]/20">
              {scheme.category_name || 'General Welfare'}
            </span>
            <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${
              isCentral 
                ? 'bg-[#FAF5E9] text-[#8C6212] border-[#F3E7CA]' 
                : 'bg-[#F7F8F5] text-[#4F594F] border-[#E5E9E3]'
            }`}>
              {isCentral ? 'Central Ministry Scheme' : `State Scheme (${scheme.state_name || 'State'})`}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#E7F3EC] text-[#176B52] border border-[#176B52]/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Government Record</span>
            </span>
          </div>

          {/* Quick Action Buttons: Share, Bookmark, Compare */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleBookmark}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-[#FAF5E9] text-[#E8A126] border-[#F3E7CA]'
                  : 'bg-white text-[#202820] hover:text-[#176B52] border-[#E5E9E3] hover:bg-[#F7F8F5]'
              }`}
              title={isBookmarked ? 'Saved to Dashboard' : 'Save Scheme'}
            >
              {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-[#E8A126]" /> : <Bookmark className="h-4 w-4" />}
              <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={toggleCompare}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isCompared
                  ? 'bg-[#E7F3EC] text-[#176B52] border-[#176B52]/40'
                  : 'bg-white text-[#202820] hover:text-[#176B52] border-[#E5E9E3] hover:bg-[#F7F8F5]'
              }`}
              title={isCompared ? 'In Compare List' : 'Add to Compare'}
            >
              <Scale className="h-4 w-4 text-[#176B52]" />
              <span className="hidden sm:inline">{isCompared ? 'Compared' : 'Compare'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="p-2 rounded-xl bg-white border border-[#E5E9E3] text-[#202820] hover:text-[#176B52] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hover:bg-[#F7F8F5]"
              title="Share Scheme"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Title & Ministry */}
        <div className="space-y-2">
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[#202820] leading-tight">
            {displayName}
          </h1>
          {(scheme.ministry_name || scheme.ministry) && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#687368]">
              <Building2 className="h-4 w-4 text-[#8A968A] shrink-0" />
              <span>{scheme.ministry_name || scheme.ministry}</span>
            </div>
          )}
        </div>

        {/* Top Summary Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E5E9E3]">
          <div className="p-3.5 rounded-2xl bg-[#F7F8F5] border border-[#E5E9E3]">
            <span className="text-[10px] uppercase font-bold text-[#687368] tracking-wider block">Benefit Quantum</span>
            <span className="text-base font-bold text-[#176B52] font-heading block mt-0.5">
              {scheme.benefits_amount || 'Financial Assistance / Subsidy'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F7F8F5] border border-[#E5E9E3]">
            <span className="text-[10px] uppercase font-bold text-[#687368] tracking-wider block">Jurisdiction Coverage</span>
            <span className="text-base font-bold text-[#202820] font-heading block mt-0.5">
              {scheme.state_name || 'Pan-India (Central)'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F7F8F5] border border-[#E5E9E3]">
            <span className="text-[10px] uppercase font-bold text-[#687368] tracking-wider block">Application Mode</span>
            <span className="text-base font-bold text-[#176B52] font-heading block mt-0.5">
              {scheme.application_url || scheme.official_website || scheme.portal_url ? 'Online Portal Submission' : 'Direct Departmental Channel'}
            </span>
          </div>
        </div>

        {/* Instant Citizen Qualifier Notice (If user scanned profile) */}
        {userProfileCheck.status !== 'not_scanned' && (
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            userProfileCheck.status === 'eligible'
              ? 'bg-[#E7F3EC] border-[#176B52]/30 text-[#124C3D]'
              : 'bg-[#FAF5E9] border-[#F3E7CA] text-[#8C6212]'
          }`}>
            {userProfileCheck.status === 'eligible' ? (
              <CheckCircle2 className="h-5 w-5 text-[#176B52] shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-[#E8A126] shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="text-xs font-bold block">
                {userProfileCheck.status === 'eligible'
                  ? 'Your Saved Demographic Profile Matches This Scheme!'
                  : 'Profile Evaluation Notice'}
              </span>
              <p className="text-xs leading-relaxed opacity-90">
                {userProfileCheck.status === 'eligible'
                  ? 'You satisfy the basic demographic criteria on record. Please review required documents below to prepare your submission.'
                  : 'Some criteria require verification. Check the eligibility requirements tab below.'}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E5E9E3] overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Benefits', icon: FileText },
          { id: 'eligibility', label: 'Eligibility Criteria', icon: CheckCircle2 },
          { id: 'documents', label: 'Required Documents', icon: Award },
          { id: 'process', label: 'Application Steps', icon: ArrowRight },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as 'overview' | 'eligibility' | 'documents' | 'process')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#176B52] text-white shadow-xs'
                  : 'text-[#687368] hover:text-[#202820] hover:bg-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E9E3] shadow-xs">
        
        {/* Tab 1: Overview & Benefits */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-bold text-[#202820] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#176B52]" />
                <span>Scheme Description & Purpose</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#4F594F] leading-relaxed whitespace-pre-line">
                {scheme.description || 'Official scheme details describing beneficiary entitlement, scope, and objectives.'}
              </p>
            </div>

            {(scheme.benefits_description || scheme.benefits) && (
              <div className="p-5 rounded-2xl bg-[#F7F8F5] border border-[#E5E9E3] space-y-2">
                <span className="text-xs font-bold text-[#176B52] uppercase tracking-wider block">
                  Detailed Benefits & Assistance Structure
                </span>
                <p className="text-xs sm:text-sm text-[#4F594F] leading-relaxed whitespace-pre-line">
                  {scheme.benefits_description || scheme.benefits}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Eligibility Criteria */}
        {activeTab === 'eligibility' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-bold text-[#202820] flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#176B52]" />
                <span>Who is Eligible?</span>
              </h2>
              <p className="text-xs text-[#687368]">
                Review the mandatory eligibility standards defined by the governing ministry.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F7F8F5] border border-[#E5E9E3] space-y-3">
              <p className="text-xs sm:text-sm text-[#4F594F] leading-relaxed whitespace-pre-line">
                {scheme.eligibility_criteria || 'General citizen eligibility as mandated by the published departmental guidelines.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#E7F3EC] border border-[#176B52]/20 text-xs text-[#124C3D] flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-[#176B52] shrink-0 mt-0.5" />
              <span>
                Want to double check? Run our <Link href="/eligibility" className="underline font-semibold text-[#176B52]">Eligibility Quick-Scan</Link> to automatically compare your profile against all 130+ schemes.
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Required Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-bold text-[#202820] flex items-center gap-2">
                <Award className="h-5 w-5 text-[#E8A126]" />
                <span>Documents Checklist</span>
              </h2>
              <p className="text-xs text-[#687368]">
                Keep scanned copies or self-attested physical photocopies ready before commencing application.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F7F8F5] border border-[#E5E9E3] space-y-3">
              <p className="text-xs sm:text-sm text-[#4F594F] leading-relaxed whitespace-pre-line">
                {scheme.documents_required || 'Standard citizen identification documents: Aadhaar card, residence proof, income certificate, and active bank passbook.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Application Steps */}
        {activeTab === 'process' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-bold text-[#202820] flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-[#176B52]" />
                <span>How to Apply</span>
              </h2>
              <p className="text-xs text-[#687368]">
                Follow these official steps to submit your application on the designated government domain.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F7F8F5] border border-[#E5E9E3] space-y-3">
              <p className="text-xs sm:text-sm text-[#4F594F] leading-relaxed whitespace-pre-line">
                {scheme.application_process || 'Applications are submitted online via the official ministry portal or through local Common Service Centers (CSC) / district collectorate counters.'}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Official Government Direct Application Action Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[#176B52]/20 bg-[#E7F3EC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#176B52]">
            <ShieldCheck className="h-4 w-4" />
            <span>Direct Government Portal Submission</span>
          </div>
          <h3 className="font-heading text-lg font-bold text-[#124C3D]">
            Ready to Submit Your Application?
          </h3>
          <p className="text-xs text-[#4F594F] leading-relaxed">
            GovSchemeAI connects you directly to the official government portal. Verify details on the authorized .gov.in domain.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href={`/chat?q=${encodeURIComponent(`Help me apply for ${scheme.name}. What documents are needed and what are the exact steps?`)}`}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F7F8F5] text-[#202820] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#E5E9E3] shadow-xs"
          >
            <Bot className="h-4 w-4 text-[#176B52]" />
            <span>Ask Advisor AI</span>
          </Link>

          {(scheme.application_url || scheme.official_website || scheme.portal_url) ? (
            <a
              href={scheme.application_url || scheme.official_website || scheme.portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#176B52] hover:bg-[#124C3D] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <span>Visit Official Portal</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <button
              disabled
              className="px-5 py-2.5 rounded-xl bg-white/70 text-[#8A968A] text-xs font-semibold cursor-not-allowed border border-[#E5E9E3]"
            >
              Portal Link Updating
            </button>
          )}
        </div>
      </div>

      {/* Share Modal Dialog */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Share Government Scheme"
        description="Share official scheme details with fellow citizens via direct link."
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#F7F8F5] border border-[#E5E9E3]">
            <div className="text-xs font-bold text-[#202820] line-clamp-1">{scheme.name}</div>
            <div className="text-[11px] text-[#687368] mt-0.5">{scheme.ministry_name || 'Government of India'}</div>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-[#687368] font-medium">Scheme Page Link</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? window.location.href : ''}
                className="w-full text-xs px-3.5 py-2 rounded-xl bg-white border border-[#E5E9E3] text-[#202820]"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-[#176B52] hover:bg-[#124C3D] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}
