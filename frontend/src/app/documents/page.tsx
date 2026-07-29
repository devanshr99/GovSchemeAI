'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, Download, CheckCircle2, ShieldCheck, FileCheck, Search } from 'lucide-react';

interface DocumentGuide {
  id: string;
  name: string;
  category: string;
  issuingAuthority: string;
  validity: string;
  keyUse: string;
  requiredFields: string[];
  downloadFormat: string;
}

const DOCUMENT_GUIDES: DocumentGuide[] = [
  {
    id: "doc-1",
    name: "Income Certificate (आय प्रमाण पत्र)",
    category: "Financial & Tax",
    issuingAuthority: "Tehsildar / District Revenue Department",
    validity: "6 Months to 1 Year",
    keyUse: "Scholarships, Income Subsidies, BPL Aid, Fee Waivers",
    requiredFields: ["Salary Slip / ITR", "Aadhaar Card", "Self-Declaration Affidavit", "Ration Card"],
    downloadFormat: "Sample Self-Declaration Format (PDF)"
  },
  {
    id: "doc-2",
    name: "Caste & Social Category Certificate (जाति प्रमाण पत्र)",
    category: "Identity & Social",
    issuingAuthority: "Sub-Divisional Magistrate (SDM) / Tehsildar",
    validity: "Permanent (Non-Creamy Layer requires annual renewal)",
    keyUse: "SC/ST/OBC Reserved Schemes, Full Fee Waiver, Top Class Education",
    requiredFields: ["Applicant Aadhaar", "Father's Caste Record", "Gram Pradhan Verification"],
    downloadFormat: "Application Checklist Format (PDF)"
  },
  {
    id: "doc-3",
    name: "Domicile / Residence Certificate (मूल निवास प्रमाण पत्र)",
    category: "Residency",
    issuingAuthority: "District Collector / District Magistrate",
    validity: "Permanent",
    keyUse: "State-specific Welfare Schemes, State quota admissions",
    requiredFields: ["Electricity Bill / Rent Agreement", "Aadhaar Card", "School Transfer Certificate"],
    downloadFormat: "Verification Checklist (PDF)"
  },
  {
    id: "doc-4",
    name: "Farmer Khatauni & Land Record (खतौनी नकल)",
    category: "Agriculture & Land",
    issuingAuthority: "State Revenue Land Record Portal (Bhulekh)",
    validity: "Latest Certified Copy (< 3 Months)",
    keyUse: "PM-KISAN, Crop Insurance, KCC Credit Card, Agri Subsidy",
    requiredFields: ["Khasra Number", "Khatauni Number", "Owner Aadhaar"],
    downloadFormat: "Land Record Verification Guide (PDF)"
  }
];

export default function DocumentCenterPage() {
  const { language, t } = useApp();
  const [search, setSearch] = useState<string>('');

  const filteredDocs = DOCUMENT_GUIDES.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.keyUse.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in relative z-10">
      {/* Banner */}
      <div className="gov-card p-6 sm:p-8 rounded-3xl border border-white/[0.08] relative overflow-hidden shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-amber-500 absolute top-0 left-0 right-0" />

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-[11px] font-extrabold text-blue-300 uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>Official Document Verification Hub</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2.5">
            <FileCheck className="h-7 w-7 text-emerald-400" />
            Document Verification & Checklist Center
          </h1>

          <p className="text-xs sm:text-sm text-slate-300">
            Check issuing authorities, validity rules, required proof files, and download verification templates for government schemes.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="gov-card p-4 rounded-2xl border border-white/[0.08]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search document requirements (e.g. Income, Caste, Land Record, Domicile)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-900 border border-white/10"
          />
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="gov-card p-6 rounded-2xl border border-white/[0.08] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                  {doc.category}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Validity: {doc.validity}</span>
              </div>

              <h2 className="text-base font-bold text-slate-100">{doc.name}</h2>
              <div className="text-xs text-slate-300 space-y-1">
                <div><strong className="text-slate-200">Issuing Authority:</strong> {doc.issuingAuthority}</div>
                <div><strong className="text-slate-200">Primary Uses:</strong> {doc.keyUse}</div>
              </div>

              <div className="border-t border-white/[0.06] pt-3 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Required Supporting Proofs:</div>
                <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-300">
                  {doc.requiredFields.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="line-clamp-1">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-4">
              <button
                onClick={() => alert(`Downloading ${doc.name} verification guide and format checklist.`)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4 text-blue-400" />
                <span>Download Sample Format Checklist</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
