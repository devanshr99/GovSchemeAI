'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../common/Logo';
import { ShieldCheck, ArrowUpRight, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // Omit footer on full-height immersive chat screen
  if (pathname === '/chat') {
    return null;
  }

  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#060910] text-slate-400 pt-12 pb-8 relative z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-white/[0.06]">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block focus-visible:outline-none">
              <Logo variant="full" size="lg" />
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              GovSchemeAI is an independent, citizen-first public welfare directory connecting Indian citizens to central and state government benefits, scholarships, and subsidies through transparent criteria evaluation.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                <ShieldCheck className="h-4 w-4" />
                <span>100% Direct Official Source Indexing</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                <Lock className="h-3.5 w-3.5" />
                <span>Zero Citizen Data Sold</span>
              </div>
            </div>
          </div>

          {/* Quick Discovery */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-blue-300 transition-colors flex items-center gap-1">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/schemes" className="hover:text-blue-300 transition-colors flex items-center gap-1">
                  All Government Schemes
                </Link>
              </li>
              <li>
                <Link href="/eligibility" className="hover:text-blue-300 transition-colors flex items-center gap-1">
                  Eligibility Quick-Scan
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-blue-300 transition-colors flex items-center gap-1">
                  Scheme Comparison Matrix
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-blue-300 transition-colors flex items-center gap-1">
                  Citizen Scheme Advisor AI
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-blue-300 transition-colors flex items-center gap-1">
                  Citizen Workspace / Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Sector Hubs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Sector Portals</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/hubs/student" className="hover:text-blue-300 transition-colors">
                  Students & Scholarships
                </Link>
              </li>
              <li>
                <Link href="/hubs/farmer" className="hover:text-blue-300 transition-colors">
                  Farmers & Agriculture (PM-KISAN)
                </Link>
              </li>
              <li>
                <Link href="/hubs/women" className="hover:text-blue-300 transition-colors">
                  Women Welfare & Maternity
                </Link>
              </li>
              <li>
                <Link href="/hubs/startup" className="hover:text-blue-300 transition-colors">
                  Startup Grants & Mudra Credit
                </Link>
              </li>
              <li>
                <Link href="/hubs/youth" className="hover:text-blue-300 transition-colors">
                  Youth & Skill Development
                </Link>
              </li>
              <li>
                <Link href="/hubs/msme" className="hover:text-blue-300 transition-colors">
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
                  className="hover:text-blue-300 transition-colors flex items-center gap-1 group"
                >
                  <span>myScheme National Portal</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a 
                  href="https://india.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-blue-300 transition-colors flex items-center gap-1 group"
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
                  className="hover:text-blue-300 transition-colors flex items-center gap-1 group"
                >
                  <span>PM-KISAN Direct Portal</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a 
                  href="https://scholarships.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-blue-300 transition-colors flex items-center gap-1 group"
                >
                  <span>National Scholarship Portal</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <Link href="/about-developer" className="hover:text-blue-300 transition-colors">
                  System Architecture & APIs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Official Verification Notice */}
        <div className="py-4 my-6 px-4 sm:px-5 rounded-xl bg-[#0E1422] border border-white/[0.06] text-xs text-slate-400 leading-relaxed">
          <p className="font-semibold text-slate-200 mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Public Service Information & Official Verification Notice</span>
          </p>
          <p>
            GovSchemeAI is an independent citizen discovery platform. Information is indexed directly from public ministry gazettes, circulars, and departmental portals. We do not charge application fees or act as brokers. All application links route directly to official government domains (.gov.in or .nic.in).
          </p>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} GovSchemeAI. Dedicated to Indian Public Welfare Transparency.</p>
          <div className="flex items-center gap-6">
            <Link href="/about-developer" className="hover:text-slate-300 transition-colors">Architecture</Link>
            <Link href="/admin" className="hover:text-slate-300 transition-colors">Staging Admin</Link>
            <span className="text-amber-400 font-medium flex items-center gap-1">
              <span>🇮🇳 Built for Citizens of India</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
