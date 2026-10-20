'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../common/Logo';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // Omit footer on full-height immersive chat screen
  if (pathname === '/chat') {
    return null;
  }

  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#07080C] text-slate-400 pt-12 pb-8 relative z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-white/[0.06]">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block focus-visible:outline-none">
              <Logo variant="full" size="lg" />
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              GovSchemeAI is an independent, citizen-first discovery platform connecting Indian citizens to central and state government benefits, scholarships, and welfare subsidies through deterministic profile matching.
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="h-4 w-4" />
              <span>100% Direct Official Source Indexing</span>
            </div>
          </div>

          {/* Quick Discovery */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-purple-300 transition-colors flex items-center gap-1">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/schemes" className="hover:text-purple-300 transition-colors flex items-center gap-1">
                  Browse All Schemes
                </Link>
              </li>
              <li>
                <Link href="/eligibility" className="hover:text-purple-300 transition-colors flex items-center gap-1">
                  Eligibility Checker
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-purple-300 transition-colors flex items-center gap-1">
                  Scheme Comparison
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-purple-300 transition-colors flex items-center gap-1">
                  Citizen Scheme Advisor AI
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-purple-300 transition-colors flex items-center gap-1">
                  Citizen Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Sector Hubs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Sector Hubs</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/hubs/student" className="hover:text-purple-300 transition-colors">
                  Student & Scholarships
                </Link>
              </li>
              <li>
                <Link href="/hubs/startup" className="hover:text-purple-300 transition-colors">
                  Startup & Business Grants
                </Link>
              </li>
              <li>
                <Link href="/hubs/farmer" className="hover:text-purple-300 transition-colors">
                  Farmers & Agriculture
                </Link>
              </li>
              <li>
                <Link href="/hubs/women" className="hover:text-purple-300 transition-colors">
                  Women Welfare & Health
                </Link>
              </li>
              <li>
                <Link href="/hubs/youth" className="hover:text-purple-300 transition-colors">
                  Youth & Skill Development
                </Link>
              </li>
              <li>
                <Link href="/hubs/msme" className="hover:text-purple-300 transition-colors">
                  MSME & Micro Enterprises
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Portals & Verification */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Official Portals</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://www.myscheme.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-purple-300 transition-colors flex items-center gap-1 group"
                >
                  <span>myScheme Portal</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a 
                  href="https://india.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-purple-300 transition-colors flex items-center gap-1 group"
                >
                  <span>National Portal of India</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a 
                  href="https://pmkisan.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-purple-300 transition-colors flex items-center gap-1 group"
                >
                  <span>PM-KISAN Portal</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a 
                  href="https://scholarships.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-purple-300 transition-colors flex items-center gap-1 group"
                >
                  <span>National Scholarship Portal</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <Link href="/about-developer" className="hover:text-purple-300 transition-colors">
                  Developer & Architecture Info
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Official Verification Disclaimer */}
        <div className="py-4 my-6 px-4 rounded-xl bg-[#0E1017] border border-white/[0.06] text-xs text-slate-400 leading-relaxed">
          <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            <span>Official Government Domain Verification Notice</span>
          </p>
          <p>
            GovSchemeAI is an independent citizen discovery platform. Information is aggregated from public government sources for guidance purposes. Citizens are strongly advised to verify final eligibility requirements, document guidelines, and deadlines on official government domain portals (ending in .gov.in or .nic.in) before applying.
          </p>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} GovSchemeAI. Independent Citizen Discovery Platform.</p>
          <div className="flex items-center gap-6">
            <Link href="/about-developer" className="hover:text-slate-300 transition-colors">System Architecture</Link>
            <Link href="/admin" className="hover:text-slate-300 transition-colors">Staging Admin</Link>
            <span className="text-purple-400 font-medium">Made for Citizens of India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
