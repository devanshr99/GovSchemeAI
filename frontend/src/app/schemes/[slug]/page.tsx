'use client';

import React, { useState, useEffect, use } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../lib/api';
import { SchemeDetail } from '../../../types/scheme';
import Link from 'next/link';
import {
  ArrowLeft, Globe, Phone, Calendar, Award, ShieldCheck,
  FileText, MapPin, Sparkles, ExternalLink, Clock, Building2,
  ChevronRight, Loader2
} from 'lucide-react';

export default function SchemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { language, t } = useApp();

  const [scheme, setScheme] = useState<SchemeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.getSchemeDetail(slug)
      .then(res => setScheme(res))
      .catch(err => {
        console.error(err);
        setError('Scheme not found or server unavailable.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl w-full py-16 px-4 space-y-8">
        {/* Skeleton Loading */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 w-24 rounded bg-slate-800 skeleton-shimmer" />
        </div>
        <div className="glass-panel rounded-2xl p-8 space-y-6">
          <div className="space-y-3">
            <div className="h-8 w-3/4 rounded bg-slate-800 skeleton-shimmer" />
            <div className="h-4 w-1/2 rounded bg-slate-800 skeleton-shimmer" />
          </div>
          <div className="h-24 rounded-xl bg-slate-800 skeleton-shimmer" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 rounded-xl bg-slate-800 skeleton-shimmer" />
            <div className="h-16 rounded-xl bg-slate-800 skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="mx-auto max-w-3xl w-full py-16 px-4 text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 border border-white/[0.08]">
          <FileText className="h-8 w-8 text-red-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-100">Scheme Not Found</h2>
          <p className="text-slate-400 max-w-md mx-auto">{error || 'The scheme you are looking for could not be found.'}</p>
        </div>
        <Link
          href="/schemes"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all"
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

  return (
    <div className="mx-auto max-w-4xl w-full py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link href="/schemes" className="hover:text-blue-400 transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" />
          All Schemes
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-300 truncate max-w-xs">{displayName}</span>
      </nav>

      {/* Main Detail Card */}
      <div className="glass-panel rounded-2xl overflow-hidden relative">
        {/* Hero gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-orange-500 via-blue-500 to-emerald-500" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {scheme.category_icon} {scheme.category_name || 'General'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {scheme.level || 'Central'}
              </span>
              {scheme.is_active ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                  Inactive
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 leading-tight">{displayName}</h1>

            {scheme.ministry && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
                <span>{scheme.ministry}</span>
              </div>
            )}
          </div>

          {/* Benefits Highlight */}
          {scheme.benefits_amount && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-orange-500/5 to-blue-500/5 border border-orange-500/15">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{t('benefits')}</div>
                <div className="text-lg font-extrabold text-orange-400">{scheme.benefits_amount}</div>
              </div>
            </div>
          )}

          {/* Description */}
          {displayDesc && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-400" />
                Description
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/[0.04]">
                {displayDesc}
              </p>
            </div>
          )}

          {/* Benefits Detail */}
          {displayBenefits && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-emerald-400" />
                {t('benefits')} Details
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed bg-emerald-500/[0.02] p-4 rounded-xl border border-emerald-500/[0.08]">
                {displayBenefits}
              </p>
            </div>
          )}

          {/* Eligibility Criteria */}
          {scheme.eligibility_rules_summary && scheme.eligibility_rules_summary.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                Eligibility Criteria
              </h2>
              <ul className="space-y-2">
                {scheme.eligibility_rules_summary.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300 bg-white/[0.01] p-3 rounded-xl border border-white/[0.04]">
                    <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Required Documents */}
          {scheme.required_documents && scheme.required_documents.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-400" />
                {t('documents')}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {scheme.required_documents.map((doc, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-sm text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-white/[0.04]">
                    <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Application Process */}
          {displayAppProcess && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                {t('applicationProcess')}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed bg-orange-500/[0.02] p-4 rounded-xl border border-orange-500/[0.08]">
                {displayAppProcess}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Info Bar */}
        <div className="border-t border-white/[0.08] bg-white/[0.01] p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Helpline */}
            {scheme.helpline && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Phone className="h-4 w-4 text-blue-400 shrink-0" />
                <div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-slate-500">{t('helpline')}</div>
                  <div className="text-sm font-bold text-slate-200">{scheme.helpline}</div>
                </div>
              </div>
            )}

            {/* Deadline */}
            {scheme.deadline && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Calendar className="h-4 w-4 text-orange-400 shrink-0" />
                <div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-slate-500">{t('deadline')}</div>
                  <div className="text-sm font-bold text-slate-200">{scheme.deadline}</div>
                </div>
              </div>
            )}

            {/* Launched Date */}
            {scheme.launched_date && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Launched</div>
                  <div className="text-sm font-bold text-slate-200">{scheme.launched_date}</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-end">
            {scheme.official_website && (
              <a
                href={scheme.official_website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                <Globe className="h-3.5 w-3.5" />
                Official Website
              </a>
            )}
            {scheme.application_url && (
              <a
                href={scheme.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t('applyNow')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
