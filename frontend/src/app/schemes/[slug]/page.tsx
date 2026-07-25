'use client';

import React, { useState, useEffect, use } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../lib/api';
import { SchemeDetail } from '../../../types/scheme';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Globe, Phone, Calendar, Award, ShieldCheck,
  FileText, MapPin, Sparkles, ExternalLink, Clock, Building2,
  ChevronRight, Share2, Bookmark, BookmarkCheck, Copy, CheckCircle2,
  XCircle, Info, ShieldAlert
} from 'lucide-react';

export default function SchemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { language, t } = useApp();
  const router = useRouter();

  const [scheme, setScheme] = useState<SchemeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [userProfileCheck, setUserProfileCheck] = useState<{
    status: 'eligible' | 'not_eligible' | 'not_scanned';
    passedRules: string[];
    failedRules: string[];
  }>({ status: 'not_scanned', passedRules: [], failedRules: [] });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    // Fetch details
    api.getSchemeDetail(slug)
      .then(res => {
        setScheme(res);
        // Check local bookmarks state
        if (typeof window !== 'undefined') {
          const saved = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
          setIsBookmarked(saved.includes(slug));
        }

        // Evaluate eligibility based on saved local profile if it exists
        const profile = api.getProfileFromStorage();
        if (profile && res.id) {
          // Send evaluation request or do it locally
          api.checkEligibility(profile)
            .then((checkRes) => {
              const matchedScheme = checkRes.schemes.find((s) => s.slug === slug);
              if (matchedScheme) {
                const passed: string[] = [];
                const failed: string[] = [];
                if (matchedScheme.rules_evaluation) {
                  matchedScheme.rules_evaluation.forEach(rule => {
                    if (rule.startsWith('✓')) passed.push(rule.replace('✓ ', ''));
                    else if (rule.startsWith('✗')) failed.push(rule.replace('✗ ', ''));
                  });
                }
                setUserProfileCheck({
                  status: failed.length === 0 ? 'eligible' : 'not_eligible',
                  passedRules: passed,
                  failedRules: failed
                });
              } else {
                // If it is active but user is strictly not eligible, checkRes.schemes won't contain it
                setUserProfileCheck({
                  status: 'not_eligible',
                  passedRules: [],
                  failedRules: ['Income limit, occupation, or residency requirements are not met.']
                });
              }
            })
            .catch(err => console.error('Eligibility dynamic evaluate failed:', err));
        }
      })
      .catch(err => {
        console.error(err);
        setError('Scheme not found or server is offline.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleBookmark = () => {
    if (!scheme) return;
    const saved = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
    let updated;
    if (saved.includes(slug)) {
      updated = saved.filter((s: string) => s !== slug);
      setIsBookmarked(false);
      showToast('Removed from saved bookmarks');
    } else {
      updated = [...saved, slug];
      setIsBookmarked(true);
      showToast('Saved to bookmarks');
    }
    localStorage.setItem('govscheme_bookmarks', JSON.stringify(updated));
  };

  const handleShare = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      navigator.share({
        title: scheme?.name || 'Government Scheme',
        text: `Check out this government scheme: ${scheme?.name}`,
        url: shareUrl
      }).catch(err => console.error(err));
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!');
    }
  };

  const handleCopyLink = () => {
    if (scheme?.official_website) {
      navigator.clipboard.writeText(scheme.official_website);
      showToast('Official website link copied!');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl w-full py-16 px-4 space-y-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 w-24 rounded bg-[#E5E7EB] skeleton-shimmer" />
        </div>
        <div className="glass-panel rounded-xl p-8 space-y-6">
          <div className="space-y-3">
            <div className="h-8 w-3/4 rounded bg-[#E5E7EB] skeleton-shimmer" />
            <div className="h-4 w-1/2 rounded bg-[#E5E7EB] skeleton-shimmer" />
          </div>
          <div className="h-24 rounded-xl bg-[#E5E7EB] skeleton-shimmer" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 rounded-xl bg-[#E5E7EB] skeleton-shimmer" />
            <div className="h-16 rounded-xl bg-[#E5E7EB] skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="mx-auto max-w-3xl w-full py-16 px-4 text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF2F2] border border-[#FECACA]">
          <FileText className="h-8 w-8 text-[#DC2626]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#111827]">Scheme Not Found</h2>
          <p className="text-[#6B7280] max-w-md mx-auto">{error || 'The scheme you are looking for could not be found.'}</p>
        </div>
        <Link
          href="/schemes"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F766E] hover:bg-[#0D5F59] text-white rounded-lg font-semibold shadow-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Schemes
        </Link>
      </div>
    );
  }

  const displayName = language === 'hi' && scheme.name_hi ? scheme.name_hi : scheme.name;
  const displayDesc = language === 'hi' && scheme.description_hi ? scheme.description_hi : scheme.description;
  const displayBenefits = language === 'hi' && scheme.benefits_hi ? scheme.benefits_hi : scheme.benefits;
  const displayAppProcess = language === 'hi' && scheme.application_process_hi ? scheme.application_process_hi : scheme.application_process;

  // Extract income limit if available
  const incomeLimitRule = scheme.eligibility_rules_summary.find(r => r.toLowerCase().includes('income'));

  // Get state readable name
  const stateNames: Record<string, string> = {
    "UP": "Uttar Pradesh", "MH": "Maharashtra", "DL": "Delhi", "KA": "Karnataka",
    "TN": "Tamil Nadu", "GJ": "Gujarat", "RJ": "Rajasthan", "MP": "Madhya Pradesh",
    "WB": "West Bengal", "AP": "Andhra Pradesh", "TG": "Telangana", "BR": "Bihar"
  };
  const stateDisplayName = scheme.state_code ? (stateNames[scheme.state_code] || scheme.state_code) : 'All India';

  return (
    <div className="mx-auto max-w-5xl w-full py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-8 right-8 px-5 py-3 rounded-xl bg-white border border-[#16A34A]/20 text-[#16A34A] text-sm font-semibold shadow-lg flex items-center gap-2 animate-fade-in z-50">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Top action row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827] transition-all group font-medium cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          {t('back')}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bookmark */}
          <button
            onClick={toggleBookmark}
            className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold ${
              isBookmarked
                ? 'bg-[#F0FDFA] border-[#0F766E]/20 text-[#0F766E]'
                : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB]'
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            <span>{isBookmarked ? 'Saved' : 'Save Scheme'}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB] transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>

          {/* Copy website link */}
          {scheme.official_website && (
            <button
              onClick={handleCopyLink}
              className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB] transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
            >
              <Copy className="h-4 w-4" />
              <span>Copy Link</span>
            </button>
          )}
        </div>
      </div>

      {/* Main card */}
      <div className="glass-panel rounded-2xl overflow-hidden relative">
        <div className="h-1 bg-[#0F766E]" />

        <div className="p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-semibold tracking-wider px-3 py-1.5 rounded-md bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/10">
                {scheme.category_icon || '📁'} {scheme.category_name || 'General'}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-3 py-1.5 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/10">
                {scheme.level || 'Central'}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-3 py-1.5 rounded-md bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB] flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {stateDisplayName}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] leading-tight">{displayName}</h1>

            {scheme.ministry && (
              <div className="flex items-center gap-2 text-[#6B7280]">
                <Building2 className="h-5 w-5 text-[#0F766E] shrink-0" />
                <span className="font-medium text-[#374151]">{scheme.ministry}</span>
              </div>
            )}
          </div>

          {/* Core Highlights Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Benefit Amount */}
            <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#F59E0B]/15 flex gap-3.5 items-center">
              <div className="h-11 w-11 rounded-lg bg-white flex items-center justify-center border border-[#F59E0B]/15 text-[#F59E0B]">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-[#6B7280] block">{t('benefits')}</span>
                <span className="text-lg font-bold text-[#B45309]">{scheme.benefits_amount || 'Various Benefits'}</span>
              </div>
            </div>

            {/* Income Limit */}
            <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/10 flex gap-3.5 items-center">
              <div className="h-11 w-11 rounded-lg bg-white flex items-center justify-center border border-[#2563EB]/10 text-[#2563EB]">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-[#6B7280] block">Income Threshold</span>
                <span className="text-sm font-bold text-[#2563EB]">
                  {incomeLimitRule ? incomeLimitRule.replace(/income/gi, '').replace(/[✓✗:-]/g, '').trim() : 'No Limit'}
                </span>
              </div>
            </div>

            {/* Deadline */}
            <div className="p-4 rounded-xl bg-[#F0FDFA] border border-[#0F766E]/10 flex gap-3.5 items-center">
              <div className="h-11 w-11 rounded-lg bg-white flex items-center justify-center border border-[#0F766E]/10 text-[#0F766E]">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-[#6B7280] block">{t('deadline')}</span>
                <span className="text-sm font-bold text-[#0F766E]">{scheme.deadline || 'Always Open'}</span>
              </div>
            </div>
          </div>

          {/* User Profile matching dynamic indicator */}
          {userProfileCheck.status !== 'not_scanned' && (
            <div className={`p-5 rounded-xl border flex gap-4 ${
              userProfileCheck.status === 'eligible'
                ? 'bg-[#F0FDF4] border-[#16A34A]/15 text-[#374151]'
                : 'bg-[#FEF2F2] border-[#DC2626]/15 text-[#374151]'
            }`}>
              <div className="mt-1 shrink-0">
                {userProfileCheck.status === 'eligible'
                  ? <CheckCircle2 className="h-6 w-6 text-[#16A34A]" />
                  : <ShieldAlert className="h-6 w-6 text-[#DC2626]" />
                }
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-[#111827] flex items-center gap-1.5">
                  {userProfileCheck.status === 'eligible'
                    ? 'Matches Your Profile Criteria!'
                    : 'Disqualified Criteria Detected'}
                </h4>
                <p className="text-xs text-[#6B7280]">
                  Based on your saved profile preferences:
                </p>
                <ul className="space-y-1 mt-1 text-xs">
                  {userProfileCheck.passedRules.map((rule, idx) => (
                    <li key={`p-${idx}`} className="flex items-center gap-1.5 text-[#374151]">
                      <span className="text-[#16A34A]">✓</span> {rule}
                    </li>
                  ))}
                  {userProfileCheck.failedRules.map((rule, idx) => (
                    <li key={`f-${idx}`} className="flex items-center gap-1.5 text-[#DC2626]">
                      <span>✗</span> {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* AI Summary Block */}
          {scheme.ai_summary && (
            <div className="p-5 rounded-xl bg-[#FFFBEB] border border-[#F59E0B]/10 space-y-2 relative overflow-hidden">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#B45309] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#F59E0B]" />
                AI Smart Summary
              </h3>
              <p className="text-sm text-[#374151] leading-relaxed italic">
                &ldquo;{scheme.ai_summary}&rdquo;
              </p>
            </div>
          )}

          {/* Description */}
          {displayDesc && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <Info className="h-4 w-4 text-[#0F766E]" />
                Scheme Overview
              </h2>
              <p className="text-sm text-[#374151] leading-relaxed bg-[#F9FAFB] p-5 rounded-xl border border-[#E5E7EB]">
                {displayDesc}
              </p>
            </div>
          )}

          {/* Benefits Detail */}
          {displayBenefits && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <Award className="h-4 w-4 text-[#F59E0B]" />
                Welfare Benefits & Incentives
              </h2>
              <p className="text-sm text-[#374151] leading-relaxed bg-[#FFFBEB] p-5 rounded-xl border border-[#F59E0B]/10">
                {displayBenefits}
              </p>
            </div>
          )}

          {/* Eligibility Criteria Checklist */}
          {scheme.eligibility_rules_summary && scheme.eligibility_rules_summary.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                Mandatory Eligibility Rules
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scheme.eligibility_rules_summary.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-[#374151] bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Documents */}
          {scheme.required_documents && scheme.required_documents.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <FileText className="h-4 w-4 text-[#2563EB]" />
                {t('documents')} Checklist
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scheme.required_documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-[#374151] bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-all">
                    <div className="h-6 w-6 rounded-md bg-[#EFF6FF] flex items-center justify-center shrink-0 border border-[#2563EB]/10 text-[#2563EB] text-xs font-semibold">
                      {idx + 1}
                    </div>
                    <span className="font-medium">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application Process */}
          {displayAppProcess && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                <Sparkles className="h-4 w-4 text-[#0F766E]" />
                How to Apply (Step-by-Step)
              </h2>
              <div className="text-sm text-[#374151] leading-relaxed bg-[#F0FDFA] p-5 rounded-xl border border-[#0F766E]/10 whitespace-pre-line">
                {displayAppProcess}
              </div>
            </div>
          )}
        </div>

        {/* Helpline, websites and apply CTA */}
        <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] p-6 sm:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-wrap gap-4">
            {scheme.helpline && (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center border border-[#2563EB]/10 text-[#2563EB] shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[9px] uppercase font-semibold tracking-wider text-[#9CA3AF]">{t('helpline')}</div>
                  <div className="text-sm font-semibold text-[#111827]">{scheme.helpline}</div>
                </div>
              </div>
            )}

            {scheme.launched_date && (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#F0FDFA] flex items-center justify-center border border-[#0F766E]/10 text-[#0F766E] shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[9px] uppercase font-semibold tracking-wider text-[#9CA3AF]">Launched On</div>
                  <div className="text-sm font-semibold text-[#111827]">{scheme.launched_date}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {scheme.official_website && (
              <a
                href={scheme.official_website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] hover:text-[#111827] rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                <Globe className="h-4 w-4" />
                Official Portal
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            )}
            {scheme.application_url && (
              <a
                href={scheme.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0F766E] hover:bg-[#0D5F59] text-white rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                {t('applyNow')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Related and Similar Schemes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Related Schemes */}
        {scheme.related_schemes && scheme.related_schemes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-[#0F766E]" />
              Related Category Schemes
            </h3>
            <div className="space-y-3">
              {scheme.related_schemes.map((rel) => (
                <Link
                  href={`/schemes/${rel.slug}`}
                  key={rel.id}
                  className="block glass-panel p-4 rounded-xl hover:border-[#0F766E]/20 hover:bg-[#FAFAFA] transition-all group"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-semibold tracking-wider text-[#0F766E] block">
                        {rel.category_name || 'General'}
                      </span>
                      <h4 className="font-semibold text-sm text-[#111827] group-hover:text-[#0F766E] transition-colors line-clamp-1">
                        {language === 'hi' && rel.name_hi ? rel.name_hi : rel.name}
                      </h4>
                      {rel.ministry && <p className="text-[10px] text-[#9CA3AF]">{rel.ministry}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Similar Level Schemes */}
        {scheme.similar_schemes && scheme.similar_schemes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-[#F59E0B]" />
              Similar Level Schemes
            </h3>
            <div className="space-y-3">
              {scheme.similar_schemes.map((sim) => (
                <Link
                  href={`/schemes/${sim.slug}`}
                  key={sim.id}
                  className="block glass-panel p-4 rounded-xl hover:border-[#F59E0B]/20 hover:bg-[#FAFAFA] transition-all group"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-semibold tracking-wider text-[#B45309] block">
                        {sim.level || 'Central'}
                      </span>
                      <h4 className="font-semibold text-sm text-[#111827] group-hover:text-[#B45309] transition-colors line-clamp-1">
                        {language === 'hi' && sim.name_hi ? sim.name_hi : sim.name}
                      </h4>
                      {sim.ministry && <p className="text-[10px] text-[#9CA3AF]">{sim.ministry}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#B45309] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
