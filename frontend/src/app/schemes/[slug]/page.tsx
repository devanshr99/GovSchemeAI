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
  ShieldAlert, Info
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
        setError('Scheme document not found or server is offline.');
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
        text: `Official Government Scheme details: ${scheme?.name}`,
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
      showToast('Official portal link copied!');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl w-full py-16 px-4 space-y-6">
        <div className="h-4 w-24 rounded bg-[#101217] skeleton-shimmer" />
        <div className="gov-card rounded-2xl p-8 space-y-6">
          <div className="h-8 w-3/4 rounded bg-[#101217] skeleton-shimmer" />
          <div className="h-4 w-1/2 rounded bg-[#101217] skeleton-shimmer" />
          <div className="h-24 rounded-xl bg-[#101217] skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="mx-auto max-w-3xl w-full py-16 px-4 text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#101217] border border-[#242832]">
          <FileText className="h-8 w-8 text-rose-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#F5F5F7]">Scheme Document Not Found</h2>
          <p className="text-[#A1A1AA] text-xs max-w-md mx-auto">{error || 'The requested scheme record could not be loaded.'}</p>
        </div>
        <Link
          href="/schemes"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-bold text-xs shadow-lg transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Schemes
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
    <div className="mx-auto max-w-5xl w-full py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-8 right-8 px-5 py-3 rounded-xl bg-[#0D0F14] border border-[#22C55E]/40 text-[#22C55E] text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 z-50">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs text-[#A1A1AA] hover:text-white transition-all font-semibold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleBookmark}
            className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold ${
              isBookmarked
                ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#A855F7]'
                : 'bg-[#101217] border-[#242832] text-[#A1A1AA] hover:text-white'
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            <span>{isBookmarked ? 'Saved' : 'Save Scheme'}</span>
          </button>

          <button
            onClick={handleShare}
            className="px-3 py-2 rounded-xl bg-[#101217] border border-[#242832] text-[#A1A1AA] hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>

          {scheme.official_website && (
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl bg-[#101217] border border-[#242832] text-[#A1A1AA] hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
            >
              <Copy className="h-4 w-4" />
              <span>Copy Link</span>
            </button>
          )}
        </div>
      </div>

      {/* Scheme Document Card Container */}
      <div className="gov-card rounded-3xl overflow-hidden relative border border-[#242832]">
        
        {/* Top Accent Stripe */}
        <div className="h-1 bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#06B6D4]" />

        <div className="p-6 sm:p-10 space-y-8">
          
          {/* Header Metadata */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-lg bg-[#8B5CF6]/15 text-[#A855F7] border border-[#8B5CF6]/30">
                {scheme.category_icon || '📁'} {scheme.category_name || 'General Welfare'}
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-lg bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
                {scheme.level || 'Central'}
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-lg bg-[#101217] text-[#A1A1AA] border border-[#242832] flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {stateDisplayName}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg border border-[#22C55E]/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Official Source
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-[#F5F5F7] leading-tight">{displayName}</h1>

            {scheme.ministry && (
              <div className="flex items-center gap-2 text-[#A1A1AA]">
                <Building2 className="h-4 w-4 text-[#A855F7] shrink-0" />
                <span className="font-semibold text-xs text-[#F5F5F7]">{scheme.ministry}</span>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Benefit Amount */}
            <div className="p-4 rounded-2xl bg-[#0D0F14] border border-[#242832] flex gap-3.5 items-center">
              <div className="h-10 w-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A855F7] shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#71717A] block">{t('benefits')}</span>
                <span className="text-sm font-bold text-[#F5F5F7]">{scheme.benefits_amount || 'Various Financial Aids'}</span>
              </div>
            </div>

            {/* Income Threshold */}
            <div className="p-4 rounded-2xl bg-[#0D0F14] border border-[#242832] flex gap-3.5 items-center">
              <div className="h-10 w-10 rounded-xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4] shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#71717A] block">Income Ceiling</span>
                <span className="text-sm font-bold text-[#F5F5F7]">
                  {incomeLimitRule ? incomeLimitRule.replace(/income/gi, '').replace(/[✓✗:-]/g, '').trim() : 'No Cap'}
                </span>
              </div>
            </div>

            {/* Deadline */}
            <div className="p-4 rounded-2xl bg-[#0D0F14] border border-[#242832] flex gap-3.5 items-center">
              <div className="h-10 w-10 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E] shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#71717A] block">{t('deadline')}</span>
                <span className="text-sm font-bold text-[#F5F5F7]">{scheme.deadline || 'Ongoing / Always Open'}</span>
              </div>
            </div>
          </div>

          {/* Citizen Saved Profile Match Notice */}
          {userProfileCheck.status !== 'not_scanned' && (
            <div className={`p-4 rounded-2xl border flex gap-3.5 ${
              userProfileCheck.status === 'eligible'
                ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#F5F5F7]'
                : 'bg-rose-500/10 border-rose-500/30 text-[#F5F5F7]'
            }`}>
              <div className="shrink-0 mt-0.5">
                {userProfileCheck.status === 'eligible'
                  ? <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
                  : <ShieldAlert className="h-5 w-5 text-rose-400" />
                }
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-[#F5F5F7]">
                  {userProfileCheck.status === 'eligible'
                    ? 'Eligible according to your saved profile!'
                    : 'Profile criteria mismatch'}
                </h4>
                <ul className="space-y-0.5 text-xs text-[#A1A1AA]">
                  {userProfileCheck.passedRules.map((rule, idx) => (
                    <li key={`p-${idx}`} className="flex items-center gap-1 text-[#22C55E]">
                      <span>✓</span> {rule}
                    </li>
                  ))}
                  {userProfileCheck.failedRules.map((rule, idx) => (
                    <li key={`f-${idx}`} className="flex items-center gap-1 text-rose-400">
                      <span>✗</span> {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* AI Summary Card */}
          {scheme.ai_summary && (
            <div className="p-5 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A855F7] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                AI Smart Overview
              </h3>
              <p className="text-xs sm:text-sm text-[#F5F5F7] leading-relaxed">
                "{scheme.ai_summary}"
              </p>
            </div>
          )}

          {/* Overview */}
          {displayDesc && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#71717A] flex items-center gap-2 border-b border-[#242832] pb-2">
                <Info className="h-4 w-4 text-[#A855F7]" />
                Scheme Summary & Objective
              </h2>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed bg-[#0D0F14] p-4 sm:p-5 rounded-2xl border border-[#242832]">
                {displayDesc}
              </p>
            </div>
          )}

          {/* Benefits Details */}
          {displayBenefits && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#71717A] flex items-center gap-2 border-b border-[#242832] pb-2">
                <Award className="h-4 w-4 text-[#A855F7]" />
                Benefits & Financial Allocation
              </h2>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed bg-[#0D0F14] p-4 sm:p-5 rounded-2xl border border-[#242832]">
                {displayBenefits}
              </p>
            </div>
          )}

          {/* Mandatory Eligibility Rules Summary */}
          {scheme.eligibility_rules_summary && scheme.eligibility_rules_summary.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#71717A] flex items-center gap-2 border-b border-[#242832] pb-2">
                <ShieldCheck className="h-4 w-4 text-[#22C55E]" />
                Eligibility Requirements Checklist
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scheme.eligibility_rules_summary.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#A1A1AA] bg-[#0D0F14] p-3.5 rounded-xl border border-[#242832]">
                    <CheckCircle2 className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Documents */}
          {scheme.required_documents && scheme.required_documents.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#71717A] flex items-center gap-2 border-b border-[#242832] pb-2">
                <FileText className="h-4 w-4 text-[#06B6D4]" />
                Required Documents Checklist
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {scheme.required_documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs text-[#F5F5F7] bg-[#0D0F14] p-3 rounded-xl border border-[#242832]">
                    <div className="h-5 w-5 rounded bg-[#8B5CF6]/20 text-[#A855F7] font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application Procedure */}
          {displayAppProcess && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#71717A] flex items-center gap-2 border-b border-[#242832] pb-2">
                <Sparkles className="h-4 w-4 text-[#A855F7]" />
                Official Application Steps
              </h2>
              <div className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed bg-[#0D0F14] p-5 rounded-2xl border border-[#242832] whitespace-pre-line">
                {displayAppProcess}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer CTA Bar */}
        <div className="border-t border-[#242832] bg-[#0D0F14] p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-4 text-xs">
            {scheme.helpline && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#A855F7]" />
                <span className="text-[#A1A1AA]">Helpline: <strong className="text-[#F5F5F7]">{scheme.helpline}</strong></span>
              </div>
            )}
            {scheme.launched_date && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#06B6D4]" />
                <span className="text-[#A1A1AA]">Launched: <strong className="text-[#F5F5F7]">{scheme.launched_date}</strong></span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Link
              href="/eligibility"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#101217] hover:bg-[#141720] border border-[#242832] text-[#F5F5F7] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Check My Eligibility
            </Link>
            {scheme.application_url && (
              <a
                href={scheme.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-extrabold shadow-lg shadow-[#8B5CF6]/20 transition-all cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                Apply on Official Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Related & Similar Schemes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {scheme.related_schemes && scheme.related_schemes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#A855F7]" />
              Related Category Schemes
            </h3>
            <div className="space-y-2">
              {scheme.related_schemes.map((rel) => (
                <Link
                  href={`/schemes/${rel.slug}`}
                  key={rel.id}
                  className="block gov-card p-4 rounded-xl border-[#242832] hover:border-[#8B5CF6]/40 transition-all group"
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-[#A855F7]">
                        {rel.category_name || 'General'}
                      </span>
                      <h4 className="font-bold text-xs text-[#F5F5F7] group-hover:text-[#A855F7] transition-colors line-clamp-1">
                        {language === 'hi' && rel.name_hi ? rel.name_hi : rel.name}
                      </h4>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#71717A] group-hover:text-[#A855F7] transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {scheme.similar_schemes && scheme.similar_schemes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
              <Award className="h-4 w-4 text-[#06B6D4]" />
              Similar Level Schemes
            </h3>
            <div className="space-y-2">
              {scheme.similar_schemes.map((sim) => (
                <Link
                  href={`/schemes/${sim.slug}`}
                  key={sim.id}
                  className="block gov-card p-4 rounded-xl border-[#242832] hover:border-[#06B6D4]/40 transition-all group"
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-[#06B6D4]">
                        {sim.level || 'Central'}
                      </span>
                      <h4 className="font-bold text-xs text-[#F5F5F7] group-hover:text-[#06B6D4] transition-colors line-clamp-1">
                        {language === 'hi' && sim.name_hi ? sim.name_hi : sim.name}
                      </h4>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#71717A] group-hover:text-[#06B6D4] transition-colors shrink-0" />
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
