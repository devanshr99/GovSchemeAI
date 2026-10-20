'use client';

import React, { useState, useEffect, use } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../lib/api';
import { SchemeDetail } from '../../../types/scheme';
import { AmazingButton } from '../../../components/common/AmazingButton';
import Link from 'next/link';
import {
  ArrowLeft, 
  Phone, 
  Calendar, 
  Award, 
  ShieldCheck,
  FileText, 
  MapPin, 
  Sparkles, 
  ExternalLink, 
  Clock, 
  Building2,
  ChevronRight, 
  Share2, 
  Bookmark, 
  BookmarkCheck, 
  Copy, 
  CheckCircle2,
  ShieldAlert, 
  Info,
  Scale,
  Coins
} from 'lucide-react';

export default function SchemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { language, t } = useApp();

  const [scheme, setScheme] = useState<SchemeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Safe lazy initializer for bookmark state
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
    let isMounted = true;

    api.getSchemeDetail(slug)
      .then(res => {
        if (!isMounted) return;
        setScheme(res);

        // Update recently viewed
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
        setError('Scheme document could not be loaded or server is offline.');
      })
      .finally(() => setLoading(false));

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const toggleBookmark = () => {
    if (!scheme) return;
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
      let updated: string[];
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
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCompare = () => {
    if (!scheme) return;
    try {
      const compareList: string[] = JSON.parse(localStorage.getItem('govscheme_compare') || '[]');
      let updated: string[];
      if (compareList.includes(slug)) {
        updated = compareList.filter((s: string) => s !== slug);
        setIsCompared(false);
        showToast('Removed from comparison list');
      } else {
        if (compareList.length >= 3) {
          updated = [...compareList.slice(1), slug];
        } else {
          updated = [...compareList, slug];
        }
        setIsCompared(true);
        showToast('Added to comparison list');
      }
      localStorage.setItem('govscheme_compare', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
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
        <div className="h-4 w-24 rounded bg-[#11131C] skeleton-shimmer" />
        <div className="gov-card rounded-2xl p-8 space-y-6 border border-white/[0.08]">
          <div className="h-8 w-3/4 rounded bg-[#161926] skeleton-shimmer" />
          <div className="h-4 w-1/2 rounded bg-[#161926] skeleton-shimmer" />
          <div className="h-28 rounded-xl bg-[#161926] skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="mx-auto max-w-3xl w-full py-16 px-4 text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0E1017] border border-white/[0.08]">
          <FileText className="h-8 w-8 text-rose-400" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-slate-100">Scheme Document Not Found</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">{error || 'The requested scheme record could not be loaded.'}</p>
        </div>
        <Link
          href="/schemes"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Schemes</span>
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
    <div className="mx-auto max-w-5xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-8 right-8 px-5 py-3 rounded-xl bg-[#0E1017]/95 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 z-50 animate-slide-up">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Breadcrumb Navigation & Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 text-slate-600" />
          <Link href="/schemes" className="hover:text-white transition-colors">Schemes</Link>
          <ChevronRight className="h-3 w-3 text-slate-600" />
          <span className="text-purple-300 font-semibold truncate max-w-xs">{displayName}</span>
        </nav>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Compare Button */}
          <button
            type="button"
            onClick={toggleCompare}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              isCompared
                ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                : 'bg-[#0E1017] border-white/[0.08] text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>{isCompared ? 'In Compare' : 'Compare'}</span>
          </button>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={toggleBookmark}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              isBookmarked
                ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                : 'bg-[#0E1017] border-white/[0.08] text-slate-400 hover:text-white'
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5 text-purple-400" /> : <Bookmark className="h-3.5 w-3.5" />}
            <span>{isBookmarked ? 'Saved' : 'Save Scheme'}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl bg-[#0E1017] border border-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>

          {/* Copy Official Link */}
          {scheme.official_website && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-[#0E1017] border border-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Link</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Scheme Document Container */}
      <div className="gov-card rounded-3xl overflow-hidden relative border border-white/[0.08]">
        
        {/* Top Accent Stripe */}
        <div className="h-1 bg-gradient-to-r from-purple-600 via-purple-400 to-cyan-500" />

        <div className="p-6 sm:p-10 space-y-8">
          
          {/* Header Metadata */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {scheme.category_icon || '📁'} {scheme.category_name || 'General Welfare'}
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                {scheme.level || 'Central'}
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-lg bg-[#0E1017] text-slate-300 border border-white/[0.08] flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{stateDisplayName}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Official Government Source</span>
              </span>
            </div>

            <h1 className="font-heading text-2xl sm:text-4xl font-black text-slate-100 leading-tight">
              {displayName}
            </h1>

            {scheme.ministry && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Building2 className="h-4 w-4 text-purple-400 shrink-0" />
                <span className="font-semibold text-slate-200">{scheme.ministry}</span>
              </div>
            )}
          </div>

          {/* Quick Metrics 3-Card Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Benefit Amount */}
            <div className="p-4 rounded-2xl bg-[#0E1017] border border-white/[0.08] flex gap-3.5 items-center">
              <div className="h-10 w-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">{t('benefits')}</span>
                <span className="text-sm font-bold text-slate-100">{scheme.benefits_amount || 'Various Financial Aids'}</span>
              </div>
            </div>

            {/* Income Ceiling */}
            <div className="p-4 rounded-2xl bg-[#0E1017] border border-white/[0.08] flex gap-3.5 items-center">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Income Ceiling</span>
                <span className="text-sm font-bold text-slate-100">
                  {incomeLimitRule ? incomeLimitRule.replace(/income/gi, '').replace(/[✓✗:-]/g, '').trim() : 'No Limit / General'}
                </span>
              </div>
            </div>

            {/* Deadline */}
            <div className="p-4 rounded-2xl bg-[#0E1017] border border-white/[0.08] flex gap-3.5 items-center">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">{t('deadline')}</span>
                <span className="text-sm font-bold text-slate-100">{scheme.deadline || 'Ongoing / Year-Round'}</span>
              </div>
            </div>
          </div>

          {/* Citizen Saved Profile Match Notice */}
          {userProfileCheck.status !== 'not_scanned' && (
            <div className={`p-4 rounded-2xl border flex gap-3.5 ${
              userProfileCheck.status === 'eligible'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-100'
                : 'bg-rose-500/10 border-rose-500/30 text-slate-100'
            }`}>
              <div className="shrink-0 mt-0.5">
                {userProfileCheck.status === 'eligible'
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  : <ShieldAlert className="h-5 w-5 text-rose-400" />
                }
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-100">
                  {userProfileCheck.status === 'eligible'
                    ? 'Eligible according to your saved profile!'
                    : 'Profile criteria mismatch'}
                </h4>
                <ul className="space-y-0.5 text-xs text-slate-400">
                  {userProfileCheck.passedRules.map((rule, idx) => (
                    <li key={`p-${idx}`} className="flex items-center gap-1 text-emerald-400">
                      <span>✓</span> <span>{rule}</span>
                    </li>
                  ))}
                  {userProfileCheck.failedRules.map((rule, idx) => (
                    <li key={`f-${idx}`} className="flex items-center gap-1 text-rose-400">
                      <span>✗</span> <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* AI Smart Overview */}
          {scheme.ai_summary && (
            <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/25 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>AI Citizen Brief</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                &ldquo;{scheme.ai_summary}&rdquo;
              </p>
            </div>
          )}

          {/* Scheme Summary & Objective */}
          {displayDesc && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                <Info className="h-4 w-4 text-purple-400" />
                <span>Scheme Objective & Summary</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0E1017] p-5 rounded-2xl border border-white/[0.08] whitespace-pre-line">
                {displayDesc}
              </div>
            </div>
          )}

          {/* Benefits Details */}
          {displayBenefits && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                <Award className="h-4 w-4 text-purple-400" />
                <span>Benefits & Financial Entitlements</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0E1017] p-5 rounded-2xl border border-white/[0.08] whitespace-pre-line">
                {displayBenefits}
              </div>
            </div>
          )}

          {/* Mandatory Eligibility Rules Summary */}
          {scheme.eligibility_rules_summary && scheme.eligibility_rules_summary.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Eligibility Requirements Checklist</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scheme.eligibility_rules_summary.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-[#0E1017] p-3.5 rounded-xl border border-white/[0.08]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Documents Checklist */}
          {scheme.required_documents && scheme.required_documents.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                <FileText className="h-4 w-4 text-cyan-400" />
                <span>Required Documents Checklist</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {scheme.required_documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs text-slate-200 bg-[#0E1017] p-3 rounded-xl border border-white/[0.08]">
                    <div className="h-5 w-5 rounded bg-purple-600/20 text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0">
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
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Official Application Procedure</span>
              </h2>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0E1017] p-5 rounded-2xl border border-white/[0.08] whitespace-pre-line">
                {displayAppProcess}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer CTA Bar */}
        <div className="border-t border-white/[0.08] bg-[#0E1017] p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-4 text-xs">
            {scheme.helpline && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-purple-400" />
                <span className="text-slate-400">Helpline: <strong className="text-slate-200">{scheme.helpline}</strong></span>
              </div>
            )}
            {scheme.launched_date && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span className="text-slate-400">Launched: <strong className="text-slate-200">{scheme.launched_date}</strong></span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <AmazingButton
              href="/eligibility"
              variant="secondary"
              size="md"
              icon={<ShieldCheck className="h-4 w-4 text-purple-400" />}
              iconPosition="left"
              className="flex-1 sm:flex-initial"
            >
              Check My Eligibility
            </AmazingButton>
            {scheme.application_url && (
              <a
                href={scheme.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-purple-600/25 transition-all cursor-pointer border border-white/20 active:scale-[0.98]"
                title="Direct link to official government submission portal"
              >
                <span>Apply on Official Portal</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Related & Similar Schemes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {scheme.related_schemes && scheme.related_schemes.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-heading text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Related Category Schemes</span>
            </h3>
            <div className="space-y-2">
              {scheme.related_schemes.map((rel) => (
                <Link
                  href={`/schemes/${rel.slug}`}
                  key={rel.id}
                  className="block gov-card p-4 rounded-xl border border-white/[0.08] hover:border-purple-500/40 transition-all group"
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-purple-400">
                        {rel.category_name || 'General'}
                      </span>
                      <h4 className="font-bold text-xs text-slate-200 group-hover:text-purple-300 transition-colors line-clamp-1">
                        {language === 'hi' && rel.name_hi ? rel.name_hi : rel.name}
                      </h4>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-purple-300 transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {scheme.similar_schemes && scheme.similar_schemes.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-heading text-sm font-bold text-slate-200 flex items-center gap-2">
              <Award className="h-4 w-4 text-cyan-400" />
              <span>Similar Level Schemes</span>
            </h3>
            <div className="space-y-2">
              {scheme.similar_schemes.map((sim) => (
                <Link
                  href={`/schemes/${sim.slug}`}
                  key={sim.id}
                  className="block gov-card p-4 rounded-xl border border-white/[0.08] hover:border-cyan-500/40 transition-all group"
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-cyan-400">
                        {sim.level || 'Central'}
                      </span>
                      <h4 className="font-bold text-xs text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {language === 'hi' && sim.name_hi ? sim.name_hi : sim.name}
                      </h4>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-300 transition-colors shrink-0" />
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
