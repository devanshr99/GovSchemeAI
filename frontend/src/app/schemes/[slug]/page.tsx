'use client';

import React, { useState, useEffect, use } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../lib/api';
import { SchemeDetail } from '../../../types/scheme';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Globe, Phone, Calendar, Award, ShieldCheck,
  FileText, MapPin, ExternalLink, Clock, Building2,
  ChevronRight, Share2, Bookmark, BookmarkCheck, Copy, CheckCircle2,
  XCircle, Info, ShieldAlert, Landmark
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
            .catch(err => console.error('Eligibility evaluation failed:', err));
        }
      })
      .catch(err => {
        console.error(err);
        setError('Scheme details not found or portal service offline.');
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
      <div className="mx-auto max-w-5xl w-full py-16 px-4 space-y-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 w-24 rounded bg-slate-900 skeleton-shimmer" />
        </div>
        <div className="gov-card rounded-3xl p-8 space-y-6">
          <div className="space-y-3">
            <div className="h-8 w-3/4 rounded bg-slate-900 skeleton-shimmer" />
            <div className="h-4 w-1/2 rounded bg-slate-900 skeleton-shimmer" />
          </div>
          <div className="h-24 rounded-xl bg-slate-900 skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="mx-auto max-w-3xl w-full py-16 px-4 text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-white/[0.08]">
          <FileText className="h-8 w-8 text-red-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-100">Scheme Detail Not Found</h2>
          <p className="text-slate-400 max-w-md mx-auto text-xs">{error || 'The requested scheme record could not be retrieved.'}</p>
        </div>
        <Link
          href="/schemes"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow transition-all text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Scheme Directory
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
    <div className="mx-auto max-w-5xl w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      {toast && (
        <div className="fixed bottom-8 right-8 px-5 py-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-fade-in z-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-all group font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          {t('back')}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleBookmark}
            className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold ${
              isBookmarked
                ? 'bg-blue-950/80 border-blue-500/40 text-blue-300'
                : 'bg-slate-900/60 border-white/[0.08] text-slate-300 hover:text-white'
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-blue-400" /> : <Bookmark className="h-4 w-4" />}
            <span>{isBookmarked ? 'Saved' : 'Save Scheme'}</span>
          </button>

          <button
            onClick={handleShare}
            className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>

          {scheme.official_website && (
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
            >
              <Copy className="h-4 w-4" />
              <span>Copy Link</span>
            </button>
          )}
        </div>
      </div>

      {/* Main detail card */}
      <div className="gov-card rounded-3xl overflow-hidden relative border border-white/[0.08] shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-amber-500" />

        <div className="p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-500/30">
                {scheme.category_icon || '📁'} {scheme.category_name || 'General Sector'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-lg bg-amber-950/70 text-amber-300 border border-amber-500/30">
                {scheme.level === 'state' ? 'State Government' : 'Central Government'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-lg bg-slate-900 text-slate-300 border border-white/[0.08] flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {stateDisplayName}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-100 leading-tight">{displayName}</h1>

            {scheme.ministry && (
              <div className="flex items-center gap-2 text-slate-400">
                <Building2 className="h-4.5 w-4.5 text-blue-400 shrink-0" />
                <span className="font-semibold text-slate-300 text-xs sm:text-sm">{scheme.ministry}</span>
              </div>
            )}
          </div>

          {/* Highlights Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex gap-3.5 items-center">
              <div className="h-10 w-10 rounded-xl bg-amber-950/60 flex items-center justify-center border border-amber-500/30 text-amber-400 shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">{t('benefits')}</span>
                <span className="text-sm font-bold text-emerald-400">{scheme.benefits_amount || 'Various Benefits'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex gap-3.5 items-center">
              <div className="h-10 w-10 rounded-xl bg-blue-950/60 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Income Ceiling</span>
                <span className="text-xs font-bold text-blue-300">
                  {incomeLimitRule ? incomeLimitRule.replace(/income/gi, '').replace(/[✓✗:-]/g, '').trim() : 'No Income Limit'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex gap-3.5 items-center">
              <div className="h-10 w-10 rounded-xl bg-emerald-950/60 flex items-center justify-center border border-emerald-500/30 text-emerald-400 shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">{t('deadline')}</span>
                <span className="text-xs font-bold text-emerald-400">{scheme.deadline || 'Ongoing / Always Open'}</span>
              </div>
            </div>
          </div>

          {/* User Evaluation Dynamic Card */}
          {userProfileCheck.status !== 'not_scanned' && (
            <div className={`p-5 rounded-2xl border flex gap-4 ${
              userProfileCheck.status === 'eligible'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-slate-200'
                : 'bg-red-950/40 border-red-500/30 text-slate-200'
            }`}>
              <div className="mt-0.5 shrink-0">
                {userProfileCheck.status === 'eligible'
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  : <ShieldAlert className="h-5 w-5 text-red-400" />
                }
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs text-slate-100">
                  {userProfileCheck.status === 'eligible'
                    ? 'Evaluated Eligible for Your Saved Profile'
                    : 'Profile Criteria Disqualification'}
                </h4>
                <ul className="space-y-1 text-xs">
                  {userProfileCheck.passedRules.map((rule, idx) => (
                    <li key={`p-${idx}`} className="flex items-center gap-1.5 text-slate-300">
                      <span className="text-emerald-400 font-bold">✓</span> {rule}
                    </li>
                  ))}
                  {userProfileCheck.failedRules.map((rule, idx) => (
                    <li key={`f-${idx}`} className="flex items-center gap-1.5 text-red-300">
                      <span className="font-bold">✗</span> {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Overview */}
          {displayDesc && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                <Info className="h-4 w-4 text-blue-400" />
                Scheme Overview
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-5 rounded-2xl border border-white/[0.06]">
                {displayDesc}
              </p>
            </div>
          )}

          {/* Benefits Detail */}
          {displayBenefits && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                <Award className="h-4 w-4 text-amber-400" />
                Welfare Benefits & Subsidies
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-5 rounded-2xl border border-white/[0.06]">
                {displayBenefits}
              </p>
            </div>
          )}

          {/* Rules Checklist */}
          {scheme.eligibility_rules_summary && scheme.eligibility_rules_summary.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Mandatory Qualification Rules
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scheme.eligibility_rules_summary.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs text-slate-300 bg-slate-900/50 p-3.5 rounded-xl border border-white/[0.06]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Documents */}
          {scheme.required_documents && scheme.required_documents.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                <FileText className="h-4 w-4 text-blue-400" />
                Required Verification Documents
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scheme.required_documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs text-slate-300 bg-slate-900/50 p-3.5 rounded-xl border border-white/[0.06]">
                    <div className="h-5 w-5 rounded bg-blue-950 flex items-center justify-center shrink-0 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                      {idx + 1}
                    </div>
                    <span className="font-medium">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application Workflow */}
          {displayAppProcess && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                <Landmark className="h-4 w-4 text-indigo-400" />
                Official Application Workflow
              </h2>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-5 rounded-2xl border border-white/[0.06] whitespace-pre-line">
                {displayAppProcess}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/[0.08] bg-slate-950/60 p-6 sm:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-wrap gap-4">
            {scheme.helpline && (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-950 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Toll-Free Helpline</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-200">{scheme.helpline}</div>
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
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Globe className="h-4 w-4 text-blue-400" />
                Official Department Portal
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            )}
            {scheme.application_url && (
              <a
                href={scheme.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                {t('applyNow')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

