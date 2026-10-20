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
  Scale
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
      return;
    }

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <Link href="/schemes" className="inline-flex items-center gap-1.5 text-xs text-purple-400 font-semibold hover:underline mb-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Schemes</span>
          </Link>
          <h1 className="font-heading text-3xl font-black text-slate-100 flex items-center gap-2.5">
            <Scale className="h-7 w-7 text-purple-400" />
            <span>Side-by-Side Scheme Comparison</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Compare government scheme benefit allocations, income limits, eligibility criteria, and required documents.
          </p>
        </div>

        {selectedSlugs.length < 3 && (
          <button
            type="button"
            onClick={addColumn}
            className="px-4 py-2 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Scheme to Compare</span>
          </button>
        )}
      </div>

      {/* Comparison Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedSlugs.map((slug, idx) => (
          <div key={idx} className="space-y-1.5 p-3 rounded-2xl bg-[#0E1017] border border-white/[0.08]">
            <div className="flex justify-between items-center text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
              <span>Scheme #{idx + 1}</span>
              {selectedSlugs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeColumn(idx)}
                  className="text-slate-500 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                  title="Remove scheme from comparison"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <select
              value={slug}
              onChange={(e) => handleSelectScheme(idx, e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-[#12141D] border border-white/[0.08] text-slate-100 focus:border-purple-500"
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
        <div className="gov-card p-8 rounded-3xl skeleton-shimmer h-80 opacity-40 border border-white/[0.08]" />
      )}

      {/* Comparison Grid Table */}
      {!loading && schemeDetails.length > 0 && (
        <div className="gov-card rounded-3xl overflow-hidden border border-white/[0.08]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#0E1017]">
                  <th className="p-4 sm:p-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider w-1/4">
                    Comparison Metric
                  </th>
                  {schemeDetails.map((detail, idx) => (
                    <th key={idx} className="p-4 sm:p-5 text-sm sm:text-base font-heading font-black text-slate-100 border-l border-white/[0.08]">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 inline-block mb-1">
                          {detail.category_name || 'General'}
                        </span>
                        <div className="line-clamp-2">{detail.name}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs text-slate-300">
                
                {/* Level */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0E1017]/60">Government Level</td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-white/[0.08] font-bold text-cyan-400">
                      {d.level || 'Central Government'}
                    </td>
                  ))}
                </tr>

                {/* Ministry */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0E1017]/60">Ministry / Department</td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-white/[0.08] text-slate-300">
                      {d.ministry || 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Benefits */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0E1017]/60">Benefit Allocation</td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-white/[0.08] font-bold text-emerald-400">
                      {d.benefits_amount || 'Various Financial / Welfare Aid'}
                    </td>
                  ))}
                </tr>

                {/* Eligibility Rules Checklist */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0E1017]/60">Key Eligibility Rules</td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-white/[0.08] space-y-1.5">
                      {d.eligibility_rules_summary && d.eligibility_rules_summary.length > 0 ? (
                        d.eligibility_rules_summary.map((rule, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-1.5 leading-snug">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{rule}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500">General citizen eligibility</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Required Documents */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0E1017]/60">Required Documents</td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-white/[0.08] space-y-1">
                      {d.required_documents && d.required_documents.length > 0 ? (
                        d.required_documents.map((doc, docIdx) => (
                          <div key={docIdx} className="flex items-center gap-1.5 text-slate-300">
                            <span className="text-purple-400">•</span>
                            <span>{doc}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500">Identity & Residence Proof</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Application Deadline */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0E1017]/60">Application Deadline</td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-white/[0.08] text-slate-300">
                      {d.deadline || 'Ongoing / Year-Round'}
                    </td>
                  ))}
                </tr>

                {/* Official Link */}
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-200 bg-[#0E1017]/60">Direct Application Link</td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 sm:p-5 border-l border-white/[0.08]">
                      {d.application_url ? (
                        <a
                          href={d.application_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs shadow-xs transition-all"
                        >
                          <span>Apply on Official Portal</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <Link
                          href={`/schemes/${d.slug}`}
                          className="text-purple-400 font-semibold hover:underline"
                        >
                          View Scheme Details
                        </Link>
                      )}
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
        <div className="gov-card rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto border border-white/[0.08]">
          <Scale className="h-10 w-10 text-purple-400 mx-auto" />
          <h2 className="font-heading text-lg font-bold text-slate-100">No Schemes Selected for Comparison</h2>
          <p className="text-xs text-slate-400">
            Select schemes from the browse catalog or choose from the dropdown above.
          </p>
          <Link
            href="/schemes"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            Browse All Schemes
          </Link>
        </div>
      )}

    </div>
  );
}
