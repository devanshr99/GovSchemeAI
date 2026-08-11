'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SchemeDetail } from '../../types/scheme';
import Link from 'next/link';
import { ArrowLeft, ArrowUpDown, CheckCircle2, ShieldCheck, ExternalLink, Plus } from 'lucide-react';

export default function CompareSchemesPage() {
  const [allSchemes, setAllSchemes] = useState<Array<{ slug: string; name: string }>>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(['pm-kisan', 'pm-awas-yojana']);
  const [schemeDetails, setSchemeDetails] = useState<SchemeDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch list of schemes for comparison selectors
    api.getSchemes({ pageSize: 50, activeOnly: true })
      .then(res => {
        if (res.schemes) {
          const list = res.schemes.map(s => ({ slug: s.slug, name: s.name }));
          setAllSchemes(list);
        }
      })
      .catch(err => console.error('Compare scheme list error:', err));
  }, []);

  useEffect(() => {
    if (selectedSlugs.length === 0) {
      setSchemeDetails([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(selectedSlugs.map(slug => api.getSchemeDetail(slug).catch(() => null)))
      .then(res => {
        setSchemeDetails(res.filter(Boolean) as SchemeDetail[]);
      })
      .finally(() => setLoading(false));
  }, [selectedSlugs]);

  const handleSelectScheme = (index: number, newSlug: string) => {
    const updated = [...selectedSlugs];
    updated[index] = newSlug;
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
    <div className="mx-auto max-w-6xl w-full py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#242832] pb-6">
        <div className="space-y-1">
          <Link href="/schemes" className="inline-flex items-center gap-1.5 text-xs text-[#A855F7] font-semibold hover:underline mb-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Schemes
          </Link>
          <h1 className="text-3xl font-black text-[#F5F5F7]">
            Side-by-Side Scheme Comparison
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            Compare government scheme benefit allocations, income limits, and document checklists.
          </p>
        </div>

        {selectedSlugs.length < 3 && (
          <button
            onClick={addColumn}
            className="px-4 py-2 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#A855F7] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Scheme to Compare
          </button>
        )}
      </div>

      {/* Comparison Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedSlugs.map((slug, idx) => (
          <div key={idx} className="space-y-1.5">
            <label className="text-[10px] uppercase font-extrabold text-[#71717A] tracking-wider block">
              Scheme #{idx + 1}
            </label>
            <select
              value={slug}
              onChange={(e) => handleSelectScheme(idx, e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#0D0F14] border border-[#242832] text-[#F5F5F7] focus:border-[#8B5CF6]"
            >
              {allSchemes.map(s => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Comparison Grid Table */}
      {!loading && schemeDetails.length > 0 && (
        <div className="gov-card rounded-3xl overflow-hidden border-[#242832]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#242832] bg-[#0D0F14]">
                  <th className="p-4 text-xs font-extrabold text-[#71717A] uppercase tracking-wider w-1/4">Criteria</th>
                  {schemeDetails.map((detail, idx) => (
                    <th key={idx} className="p-4 text-sm font-black text-[#F5F5F7] border-l border-[#242832]">
                      {detail.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242832] text-xs text-[#A1A1AA]">
                
                {/* Level */}
                <tr>
                  <td className="p-4 font-bold text-[#F5F5F7] bg-[#0D0F14]/50">Government Level</td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 border-l border-[#242832] font-semibold text-[#A855F7]">
                      {d.level || 'Central'}
                    </td>
                  ))}
                </tr>

                {/* Ministry */}
                <tr>
                  <td className="p-4 font-bold text-[#F5F5F7] bg-[#0D0F14]/50">Ministry / Department</td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 border-l border-[#242832]">{d.ministry || 'N/A'}</td>
                  ))}
                </tr>

                {/* Benefits */}
                <tr>
                  <td className="p-4 font-bold text-[#F5F5F7] bg-[#0D0F14]/50">Benefit Amount</td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 border-l border-[#242832] font-bold text-[#22C55E]">
                      {d.benefits_amount || 'Various Benefits'}
                    </td>
                  ))}
                </tr>

                {/* Eligibility Rules */}
                <tr>
                  <td className="p-4 font-bold text-[#F5F5F7] bg-[#0D0F14]/50">Eligibility Summary</td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 border-l border-[#242832] space-y-1">
                      {d.eligibility_rules_summary?.map((rule, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-1">
                          <span className="text-[#22C55E]">✓</span>
                          <span>{rule}</span>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* Deadline */}
                <tr>
                  <td className="p-4 font-bold text-[#F5F5F7] bg-[#0D0F14]/50">Application Deadline</td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 border-l border-[#242832]">{d.deadline || 'Always Open'}</td>
                  ))}
                </tr>

                {/* Action Link */}
                <tr>
                  <td className="p-4 font-bold text-[#F5F5F7] bg-[#0D0F14]/50">Official Link</td>
                  {schemeDetails.map((d, i) => (
                    <td key={i} className="p-4 border-l border-[#242832]">
                      {d.application_url ? (
                        <a
                          href={d.application_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B5CF6] hover:underline"
                        >
                          <span>Official Portal</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span>N/A</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
