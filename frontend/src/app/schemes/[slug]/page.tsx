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
  Info, ShieldAlert
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

    api.getSchemeDetail(slug)
      .then(res => {
        setScheme(res);
        if (typeof window !== 'undefined') {
          const saved = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
          setIsBookmarked(saved.includes(slug));
        }

        const profile = api.getProfileFromStorage();
        if (profile && res.id) {
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
          <div className="h-4 w-24 rounded bg-[#EAECF0] skeleton-shimmer" />
        </div>
        <div className="glass-panel rounded-2xl p-8 space-y-6">
          <div className="space-y-3">
            <div className="h-8 w-3/4 rounded bg-[#EAECF0] skeleton-shimmer" />
            <div className="h-4 w-1/2 rounded bg-[#EAECF0] skeleton-shimmer" />
          </div>
          <div className="h-24 rounded-2xl bg-[#EAECF0] skeleton-shimmer" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 rounded-2xl bg-[#EAECF0] skeleton-shimmer" />
            <div className="h-16 rounded-2xl bg-[#EAECF0] skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="mx-auto max-w-3xl w-full py-16 px-4 text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF2F2] border border-[#FEE2E2]">
          <FileText className="h-8 w-8 text-[#F04438]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#101828]">Scheme Not Found</h2>
          <p className="text-[#667085] max-w-md mx-auto">{error || 'The scheme you are looking for could not be found.'}</p>
        </div>
        <Link
          href="/schemes"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-semibold shadow-sm transition-all"
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

  const incomeLimitRule = scheme.eligibility_rules_summary.find(r => r.toLowerCase().includes('income'));

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
        <div className="fixed bottom-8 right-8 px-5 py-3 rounded-xl bg-white border border-[#12B76A]/20 text-[#12B76A] text-sm font-semibold shadow-xl flex items-center gap-2 animate-fade-in z-50">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Top action row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[#667085] hover:text-[#101828] transition-all group font-medium cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          {t('back')}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bookmark */}
          <button
            onClick={toggleBookmark}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold ${
              isBookmarked
                ? 'bg-[#EFF6FF] border-[#2563EB]/20 text-[#2563EB]'
                : 'bg-white border-[#E4E7EC] text-[#667085] hover:text-[#101828] hover:border-[#D0D5DD]'
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            <span>{isBookmarked ? 'Saved' : 'Save Scheme'}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-white border border-[#E4E7EC] text-[#667085] hover:text-[#101828] hover:border-[#D0D5DD] transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>

          {/* Copy website link */}
          {scheme.official_website && (
            <button
              onClick={handleCopyLink}
              className="p-2.5 rounded-xl bg-white border border-[#E4E7EC] text-[#667085] hover:text-[#101828] hover:border-[#D0D5DD] transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
            >
              <Copy className="h-4 w-4" />
              <span>Copy Link</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="glass-panel rounded-2xl overflow-hidden relative">
        <div className="h-1 bg-[#2563EB]" />

        <div className="p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase font-semibold tracking-wider px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/15">
                {scheme.category_icon || '📁'} {scheme.category_name || 'General'}
              </span>
              <span className="text-[11px] uppercase font-semibold tracking-wider px-3 py-1 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/15">
                {scheme.level || 'Central'}
              </span>
              <span className="text-[11px] uppercase font-semibold tracking-wider px-3 py-1 rounded-full bg-[#F8FAFC] text-[#344054] border border-[#E4E7EC] flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {stateDisplayName}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101828] leading-tight">{displayName}</h1>

            {scheme.ministry && (
              <div className="flex items-center gap-2 text-[#667085]">
                <Building2 className="h-5 w-5 text-[#2563EB] shrink-0" />
                <span className="font-medium text-[#344054]">{scheme.ministry}</span>
              </div>
            )}
          </div>

          {/* Core Highlights Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Benefit Amount */}
            <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#F59E0B]/20 flex gap-3.5 items-center">
              <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center border border-[#F59E0B]/20 text-[#F59E0B]">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#667085] block">{t('benefits')}</span>
                <span className="text-lg font-bold text-[#B45309]">{scheme.benefits_amount || 'Various Benefits'}</span>
              </div>
            </div>

            {/* Income Limit */}
            <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/15 flex gap-3.5 items-center">
              <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center border border-[#2563EB]/15 text-[#2563EB]">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#667085] block">Income Threshold</span>
                <span className="text-sm font-bold text-[#2563EB]">
                  {incomeLimitRule ? incomeLimitRule.replace(/income/gi, '').replace(/[✓✗:-]/g, '').trim() : 'No Limit'}
                </span>
              </div>
            </div>

            {/* Deadline */}
            <div className="p-4 rounded-xl bg-[#F0FDFA] border border-[#0F766E]/15 flex gap-3.5 items-center">
              <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center border border-[#0F766E]/15 text-[#0F766E]">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#667085] block">{t('deadline')}</span>
                <span className="text-sm font-bold text-[#0F766E]">{scheme.deadline || 'Always Open'}</span>
              </div>
            </div>
          </div>

          {/* User Profile matching dynamic indicator */}
          {userProfileCheck.status !== 'not_scanned' && (
            <div className={`p-5 rounded-2xl border flex gap-4 ${
              userProfileCheck.status === 'eligible'
                ? 'bg-[#ECFDF5] border-[#12B76A]/20 text-[#344054]'
                : 'bg-[#FEF2F2] border-[#F04438]/20 text-[#344054]'
            }`}>
              <div className="mt-1 shrink-0">
                {userProfileCheck.status === 'eligible'
                  ? <CheckCircle2 className="h-6 w-6 text-[#12B76A]" />
                  : <ShieldAlert className="h-6 w-6 text-[#F04438]" />
                }
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-[#101828] flex items-center gap-1.5">
                  {userProfileCheck.status === 'eligible'
                    ? 'Matches Your Profile Criteria!'
                    : 'Disqualified Criteria Detected'}
                </h4>
                <p className="text-xs text-[#667085]">
                  Based on your saved profile preferences:
                </p>
                <ul className="space-y-1 mt-1 text-xs">
                  {userProfileCheck.passedRules.map((rule, idx) => (
                    <li key={`p-${idx}`} className="flex items-center gap-1.5 text-[#344054]">
                      <span className="text-[#12B76A] font-bold">✓</span> {rule}
                    </li>
                  ))}
                  {userProfileCheck.failedRules.map((rule, idx) => (
                    <li key={`f-${idx}`} className="flex items-center gap-1.5 text-[#F04438] font-bold">
                      <span>✗</span> {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* AI Summary Block */}
          {scheme.ai_summary && (
            <div className="p-5 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B]/20 space-y-2 relative overflow-hidden">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#B45309] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#F59E0B]" />
                AI Smart Summary
              </h3>
              <p className="text-sm text-[#344054] leading-relaxed italic">
                &ldquo;{scheme.ai_summary}&rdquo;
              </p>
            </div>
          )}

          {/* Description */}
          {displayDesc && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#667085] flex items-center gap-2 border-b border-[#E4E7EC] pb-2">
                <Info className="h-4 w-4 text-[#2563EB]" />
                Scheme Overview
              </h2>
              <p className="text-sm text-[#344054] leading-relaxed bg-[#F8FAFC] p-5 rounded-2xl border border-[#E4E7EC]">
                {displayDesc}
              </p>
            </div>
          )}

          {/* Benefits Detail */}
          {displayBenefits && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#667085] flex items-center gap-2 border-b border-[#E4E7EC] pb-2">
                <Award className="h-4 w-4 text-[#F59E0B]" />
                Welfare Benefits & Incentives
              </h2>
              <p className="text-sm text-[#344054] leading-relaxed bg-[#FFFBEB] p-5 rounded-2xl border border-[#F59E0B]/15">
                {displayBenefits}
              </p>
            </div>
          )}

          {/* Eligibility Criteria Checklist */}
          {scheme.eligibility_rules_summary && scheme.eligibility_rules_summary.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#667085] flex items-center gap-2 border-b border-[#E4E7EC] pb-2">
                <ShieldCheck className="h-4 w-4 text-[#12B76A]" />
                Mandatory Eligibility Rules
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scheme.eligibility_rules_summary.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-[#344054] bg-[#F8FAFC] p-4 rounded-xl border border-[#E4E7EC]">
                    <CheckCircle2 className="h-4 w-4 text-[#12B76A] shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Documents */}
          {scheme.required_documents && scheme.required_documents.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#667085] flex items-center gap-2 border-b border-[#E4E7EC] pb-2">
                <FileText className="h-4 w-4 text-[#2563EB]" />
                {t('documents')} Checklist
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scheme.required_documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-[#344054] bg-[#F8FAFC] p-4 rounded-xl border border-[#E4E7EC] hover:bg-[#F2F4F7] transition-all">
                    <div className="h-6 w-6 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0 border border-[#2563EB]/15 text-[#2563EB] text-xs font-semibold">
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
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#667085] flex items-center gap-2 border-b border-[#E4E7EC] pb-2">
                <Sparkles className="h-4 w-4 text-[#2563EB]" />
                How to Apply (Step-by-Step)
              </h2>
              <div className="text-sm text-[#344054] leading-relaxed bg-[#EFF6FF] p-5 rounded-2xl border border-[#2563EB]/15 whitespace-pre-line">
                {displayAppProcess}
              </div>
            </div>
          )}
        </div>

        {/* Helpline & Official Website links */}
        <div className="border-t border-[#E4E7EC] bg-[#F8FAFC] p-6 sm:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-wrap gap-6">
            {scheme.helpline && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center border border-[#2563EB]/15 text-[#2563EB] shrink-0">
                  <Phone className="h-4 w-4 stroke-[2]" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-[#98A2B3]">{t('helpline')}</div>
                  <div className="text-sm font-semibold text-[#101828]">{scheme.helpline}</div>
                </div>
              </div>
            )}

            {scheme.launched_date && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#F0FDFA] flex items-center justify-center border border-[#0F766E]/15 text-[#0F766E] shrink-0">
                  <Clock className="h-4 w-4 stroke-[2]" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-[#98A2B3]">Launched On</div>
                  <div className="text-sm font-semibold text-[#101828]">{scheme.launched_date}</div>
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
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-[#E4E7EC] hover:border-[#D0D5DD] hover:bg-[#F8FAFC] text-[#344054] hover:text-[#101828] rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                <Globe className="h-4 w-4" />
                Official Portal
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </a>
            )}
            {scheme.application_url && (
              <a
                href={scheme.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
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
        {scheme.related_schemes && scheme.related_schemes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#101828] flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-[#2563EB]" />
              Related Category Schemes
            </h3>
            <div className="space-y-3">
              {scheme.related_schemes.map((rel) => (
                <Link
                  href={`/schemes/${rel.slug}`}
                  key={rel.id}
                  className="block glass-panel p-4 rounded-xl hover:border-[#2563EB]/30 hover:bg-[#FAFAFA] transition-all group"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#2563EB] block">
                        {rel.category_name || 'General'}
                      </span>
                      <h4 className="font-semibold text-sm text-[#101828] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                        {language === 'hi' && rel.name_hi ? rel.name_hi : rel.name}
                      </h4>
                      {rel.ministry && <p className="text-[10px] text-[#98A2B3]">{rel.ministry}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#98A2B3] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {scheme.similar_schemes && scheme.similar_schemes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#101828] flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-[#F59E0B]" />
              Similar Level Schemes
            </h3>
            <div className="space-y-3">
              {scheme.similar_schemes.map((sim) => (
                <Link
                  href={`/schemes/${sim.slug}`}
                  key={sim.id}
                  className="block glass-panel p-4 rounded-xl hover:border-[#F59E0B]/30 hover:bg-[#FAFAFA] transition-all group"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#B45309] block">
                        {sim.level || 'Central'}
                      </span>
                      <h4 className="font-semibold text-sm text-[#101828] group-hover:text-[#B45309] transition-colors line-clamp-1">
                        {language === 'hi' && sim.name_hi ? sim.name_hi : sim.name}
                      </h4>
                      {sim.ministry && <p className="text-[10px] text-[#98A2B3]">{sim.ministry}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#98A2B3] group-hover:text-[#B45309] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
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
