'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COMPREHENSIVE_SCHEMES } from '../../data/comprehensiveSchemes';
import { SchemeDetail } from '../../types/scheme';
import Link from 'next/link';
import {
  ArrowLeft, ArrowUpDown, CheckCircle2, ShieldCheck, Globe,
  ExternalLink, FileText, Award, Building2, Phone, Calendar
} from 'lucide-react';

export default function SchemeComparisonPage() {
  const { language, t } = useApp();

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([
    "nmmss-scholarship",
    "aicte-pragati-scholarship",
    "startup-india-seed-fund"
  ]);

  const selectedSchemes = COMPREHENSIVE_SCHEMES.filter((s) => selectedSlugs.includes(s.slug));

  const addSchemeToCompare = (slug: string) => {
    if (selectedSlugs.length < 3 && !selectedSlugs.includes(slug)) {
      setSelectedSlugs([...selectedSlugs, slug]);
    }
  };

  const removeSchemeFromCompare = (slug: string) => {
    if (selectedSlugs.length > 1) {
      setSelectedSlugs(selectedSlugs.filter(s => s !== slug));
    }
  };

  return (
    <div className="mx-auto max-w-6xl w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      {/* Header */}
      <div className="gov-card p-6 sm:p-8 rounded-3xl border border-white/[0.08] relative overflow-hidden shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-amber-500 absolute top-0 left-0 right-0" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-[11px] font-extrabold text-blue-300 uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Side-by-Side Evaluation Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2">
              Scheme Comparison Matrix
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Compare benefits, eligibility guidelines, income limits, documents, and application steps across up to 3 government schemes.
            </p>
          </div>

          {/* Add Scheme Selector */}
          <div className="w-full sm:w-64">
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Add Scheme to Compare</label>
            <select
              onChange={(e) => {
                if (e.target.value) addSchemeToCompare(e.target.value);
              }}
              value=""
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-white/10 text-white"
            >
              <option value="">Select a scheme...</option>
              {COMPREHENSIVE_SCHEMES.map((sch) => (
                <option key={sch.slug} value={sch.slug} disabled={selectedSlugs.includes(sch.slug)}>
                  {sch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="gov-card rounded-3xl border border-white/[0.08] overflow-x-auto shadow-2xl">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-slate-900/60">
              <th className="p-4 sm:p-5 text-xs font-black uppercase text-slate-400 w-1/4">Comparison Metric</th>
              {selectedSchemes.map((sch) => (
                <th key={sch.slug} className="p-4 sm:p-5 text-xs font-bold text-slate-100 w-1/3 border-l border-white/[0.06]">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                        {sch.level || 'Central'}
                      </span>
                      {selectedSchemes.length > 1 && (
                        <button
                          onClick={() => removeSchemeFromCompare(sch.slug)}
                          className="text-[10px] text-red-400 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="font-extrabold text-sm text-slate-100 line-clamp-2">{sch.name}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-xs">
            {/* Ministry */}
            <tr>
              <td className="p-4 font-bold text-slate-400 bg-slate-950/40">Ministry / Dept</td>
              {selectedSchemes.map((sch) => (
                <td key={sch.slug} className="p-4 border-l border-white/[0.06] text-slate-300 font-medium">
                  {sch.ministry || 'N/A'}
                </td>
              ))}
            </tr>

            {/* Benefits Amount */}
            <tr>
              <td className="p-4 font-bold text-slate-400 bg-slate-950/40">Financial Benefits</td>
              {selectedSchemes.map((sch) => (
                <td key={sch.slug} className="p-4 border-l border-white/[0.06] font-bold text-emerald-400">
                  {sch.benefits_amount || 'Varies'}
                </td>
              ))}
            </tr>

            {/* Target Sector */}
            <tr>
              <td className="p-4 font-bold text-slate-400 bg-slate-950/40">Target Sector</td>
              {selectedSchemes.map((sch) => (
                <td key={sch.slug} className="p-4 border-l border-white/[0.06] text-slate-300">
                  {sch.category_name || 'General Sector'}
                </td>
              ))}
            </tr>

            {/* Eligibility Rules */}
            <tr>
              <td className="p-4 font-bold text-slate-400 bg-slate-950/40">Mandatory Rules</td>
              {selectedSchemes.map((sch) => (
                <td key={sch.slug} className="p-4 border-l border-white/[0.06] text-slate-300 space-y-1.5">
                  {sch.eligibility_rules_summary?.map((r, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </td>
              ))}
            </tr>

            {/* Required Documents */}
            <tr>
              <td className="p-4 font-bold text-slate-400 bg-slate-950/40">Required Documents</td>
              {selectedSchemes.map((sch) => (
                <td key={sch.slug} className="p-4 border-l border-white/[0.06] text-slate-300 space-y-1">
                  {sch.required_documents?.map((doc, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </td>
              ))}
            </tr>

            {/* Deadline */}
            <tr>
              <td className="p-4 font-bold text-slate-400 bg-slate-950/40">Application Deadline</td>
              {selectedSchemes.map((sch) => (
                <td key={sch.slug} className="p-4 border-l border-white/[0.06] font-bold text-amber-400">
                  {sch.deadline || 'Ongoing / Open'}
                </td>
              ))}
            </tr>

            {/* Apply Links */}
            <tr>
              <td className="p-4 font-bold text-slate-400 bg-slate-950/40">Official Portal</td>
              {selectedSchemes.map((sch) => (
                <td key={sch.slug} className="p-4 border-l border-white/[0.06]">
                  {sch.application_url && (
                    <a
                      href={sch.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-xs"
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
