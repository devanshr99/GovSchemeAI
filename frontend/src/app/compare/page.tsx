'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SchemeDetail } from '../../types/scheme';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ExternalLink, 
  Plus, 
  X, 
  Scale,
  ShieldCheck,
  FileCheck2,
  Calendar,
  Building2,
  IndianRupee
} from 'lucide-react';

export default function CompareSchemesPage() {
  const [allSchemes, setAllSchemes] = useState<Array<{ slug: string; name: string }>>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('govscheme_compare') || '[]');
        if (Array.isArray(stored) && stored.length > 0) return stored.slice(0, 3);
      } catch {
        // fallback
      }
    }
    return ['pm-kisan', 'pm-awas-yojana'];
  });
  const [schemeDetails, setSchemeDetails] = useState<SchemeDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch list of schemes for comparison selectors
    api.getSchemes({ pageSize: 60, activeOnly: true })
      .then(res => {
        if (res.schemes) {
          const list = res.schemes.map(s => ({ slug: s.slug, name: s.name }));
          setAllSchemes(list);
        }
      })
      .catch(err => console.error('Compare scheme list error:', err));
  }, []);

  useEffect(() => {
    let isCurrent = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('govscheme_compare', JSON.stringify(selectedSlugs));
    }

    if (selectedSlugs.length === 0) {
      setSchemeDetails([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(selectedSlugs.map(slug => api.getSchemeDetail(slug).catch(() => null)))
      .then(res => {
        if (!isCurrent) return;
        setSchemeDetails(res.filter(Boolean) as SchemeDetail[]);
        setLoading(false);
      })
      .catch(() => {
        if (!isCurrent) return;
        setLoading(false);
      });

    return () => { isCurrent = false; };
  }, [selectedSlugs]);

  const handleSelectScheme = (index: number, newSlug: string) => {
    const updated = [...selectedSlugs];
    updated[index] = newSlug;
    setSelectedSlugs(updated);
  };

  const removeColumn = (index: number) => {
    const updated = selectedSlugs.filter((_, i) => i !== index);
    setSelectedSlugs(updated);
  };

  const addColumn = () => {
    if (selectedSlugs.length < 3 && allSchemes.length > selectedSlugs.length) {
      const unused = allSchemes.find(s => !selectedSlugs.includes(s.slug));
      if (unused) {
        setSelectedSlugs([...selectedSlugs, unused.slug]);
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <Link 
            href="/schemes" 
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-semibold hover:underline mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Schemes</span>
          </Link>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-100 flex items-center gap-3">
            <Scale className="h-8 w-8 text-blue-400" />
            <span>Scheme Comparison Matrix</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Compare welfare allocations, income criteria, eligibility rules, and official application requirements side by side.
          </p>
        </div>

        {selectedSlugs.length < 3 && (
          <button
            type="button"
            onClick={addColumn}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Scheme to Compare ({selectedSlugs.length}/3)</span>
          </button>
        )}
      </div>

      {/* Comparison Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedSlugs.map((slug, idx) => (
          <div key={idx} className="space-y-2 p-3.5 rounded-2xl bg-[#111827] border border-slate-800 shadow-sm">
            <div className="flex justify-between items-center text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
              <span className="flex items-center gap-1 text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Slot #{idx + 1}
              </span>
              {selectedSlugs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeColumn(idx)}
                  className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer rounded-lg hover:bg-white/[0.04]"
                  title="Remove scheme from comparison"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <select
              value={slug}
              onChange={(e) => handleSelectScheme(idx, e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-[#0b0f19] border border-slate-700/80 text-slate-100 focus:border-blue-500 focus:outline-none"
            >
              {allSchemes.map(s => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-8 rounded-3xl bg-[#111827] border border-slate-800 h-80 animate-pulse" />
      )}

      {/* Comparison Grid Table */}
      {!loading && schemeDetails.length > 0 && (
        <div className="rounded-3xl overflow-hidden border border-slate-800 bg-[#111827] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0e1726]">
                  <th className="p-4 sm:p-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider w-1/4">
                    Evaluation Parameter
                  </th>
                  {schemeDetails.map((detail, idx) => (
                    <th key={idx} className="p-4 sm:p-5 text-sm sm:text-base font-heading font-black text-slate-100 border-l border-slate-800">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 inline-block">
                          {detail.category_name || 'General'}
                        </span>
                        <div className="line-clamp-2 leading-snug">{detail.name}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                
                {/* Level */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0b0f19]/60">
                    Jurisdiction Level
                  </td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-slate-800 font-semibold">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        d.level === 'central'
                          ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}>
                        {d.level || 'Central Government'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Ministry */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0b0f19]/60">
                    Ministry / Department
                  </td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-slate-800 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{d.ministry || 'N/A'}</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Benefits */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0b0f19]/60">
                    Benefit Allocation
                  </td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-slate-800 font-bold text-emerald-400 text-sm">
                      <div className="flex items-center gap-1.5">
                        <IndianRupee className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{d.benefits_amount || 'Direct Financial Aid / Subsidy'}</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Eligibility Rules Checklist */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0b0f19]/60 align-top">
                    Eligibility Rules
                  </td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-slate-800 space-y-2 align-top">
                      {d.eligibility_rules_summary && d.eligibility_rules_summary.length > 0 ? (
                        d.eligibility_rules_summary.map((rule, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-2 leading-relaxed">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-slate-300">{rule}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500">General citizen eligibility criteria</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Required Documents */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0b0f19]/60 align-top">
                    Required Documents
                  </td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-slate-800 space-y-1.5 align-top">
                      {d.required_documents && d.required_documents.length > 0 ? (
                        d.required_documents.map((doc, docIdx) => (
                          <div key={docIdx} className="flex items-center gap-2 text-slate-300">
                            <FileCheck2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                            <span>{doc}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500">Identity & Residence Proof (Aadhaar, Bank Passbook)</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Application Deadline */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0b0f19]/60">
                    Application Cycle
                  </td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-slate-800 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span>{d.deadline || 'Ongoing / Year-Round Applications'}</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Official Link */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0b0f19]/60">
                    Official Portal Action
                  </td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        {d.application_url ? (
                          <a
                            href={d.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-xs transition-all"
                          >
                            <span>Official Apply</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                        <Link
                          href={`/schemes/${d.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0b0f19] hover:bg-[#151c2e] border border-slate-700/80 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && schemeDetails.length === 0 && (
        <div className="rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto border border-slate-800 bg-[#111827]">
          <Scale className="h-10 w-10 text-blue-400 mx-auto" />
          <h2 className="font-heading text-lg font-bold text-slate-100">No Schemes Selected for Comparison</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select schemes from the discovery catalog or choose options from the dropdowns above.
          </p>
          <Link
            href="/schemes"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
          >
            Browse All Schemes
          </Link>
        </div>
      )}

    </div>
  );
}
