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
    <footer className="w-full border-t border-[#E5E9E3] bg-white text-[#687368] pt-14 pb-10 relative z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-[#E5E9E3]">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block focus-visible:outline-none">
              <Logo variant="full" size="lg" />
            </Link>
            <p className="text-xs sm:text-sm text-[#687368] leading-relaxed max-w-md">
              GovSchemeAI is an independent, citizen-first public welfare directory connecting Indian citizens to central and state government benefits, scholarships, and subsidies through transparent criteria evaluation.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#176B52] bg-[#E7F3EC] border border-[#176B52]/20 px-3 py-1.5 rounded-lg">
                <ShieldCheck className="h-4 w-4" />
                <span>100% Direct Official Source Indexing</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#687368] bg-[#F7F8F5] border border-[#E5E9E3] px-3 py-1.5 rounded-lg">
                <Lock className="h-3.5 w-3.5 text-[#176B52]" />
                <span>Zero Citizen Data Sold</span>
              </div>
            </div>
          </div>

          {/* Quick Discovery */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#202820]">Platform Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-[#176B52] transition-colors flex items-center gap-1">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/schemes" className="hover:text-[#176B52] transition-colors flex items-center gap-1">
                  All Government Schemes
                </Link>
              </li>
              <li>
                <Link href="/eligibility" className="hover:text-[#176B52] transition-colors flex items-center gap-1">
                  Eligibility Quick-Scan
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-[#176B52] transition-colors flex items-center gap-1">
                  Scheme Comparison Matrix
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-[#176B52] transition-colors flex items-center gap-1">
                  Citizen Scheme Advisor AI
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#176B52] transition-colors flex items-center gap-1">
                  Citizen Workspace / Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Sector Hubs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#202820]">Sector Portals</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/hubs/student" className="hover:text-[#176B52] transition-colors">
                  Students & Scholarships
                </Link>
              </li>
              <li>
                <Link href="/hubs/farmer" className="hover:text-[#176B52] transition-colors">
                  Farmers & Agriculture (PM-KISAN)
                </Link>
              </li>
              <li>
                <Link href="/hubs/women" className="hover:text-[#176B52] transition-colors">
                  Women Welfare & Maternity
                </Link>
              </li>
              <li>
                <Link href="/hubs/startup" className="hover:text-[#176B52] transition-colors">
                  Startup Grants & Mudra Credit
                </Link>
              </li>
              <li>
                <Link href="/hubs/youth" className="hover:text-[#176B52] transition-colors">
                  Youth & Skill Development
                </Link>
              </li>
              <li>
                <Link href="/hubs/msme" className="hover:text-[#176B52] transition-colors">
                  MSME & Micro Enterprises
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Portals & Verification */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#202820]">Official Portals</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://www.myscheme.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-[#176B52] transition-colors flex items-center gap-1 group"
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
                  className="hover:text-[#176B52] transition-colors flex items-center gap-1 group"
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
                  className="hover:text-[#176B52] transition-colors flex items-center gap-1 group"
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
                  className="hover:text-[#176B52] transition-colors flex items-center gap-1 group"
                >
                  <span>National Scholarship Portal</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <Link href="/about-developer" className="hover:text-[#176B52] transition-colors">
                  System Architecture & APIs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Official Verification Notice */}
        <div className="py-4 my-6 px-5 rounded-2xl bg-[#FAF5E9] border border-[#F3E7CA] text-xs text-[#687368] leading-relaxed">
          <p className="font-semibold text-[#202820] mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E8A126]" />
            <span>Public Service Information & Official Verification Notice</span>
          </p>
          <p>
            GovSchemeAI is an independent citizen discovery platform. Information is indexed directly from public ministry gazettes, circulars, and departmental portals. We do not charge application fees or act as brokers. All application links route directly to official government domains (.gov.in or .nic.in).
          </p>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A968A]">
          <p>© {new Date().getFullYear()} GovSchemeAI. Dedicated to Indian Public Welfare Transparency.</p>
          <div className="flex items-center gap-6">
            <Link href="/about-developer" className="hover:text-[#202820] transition-colors">Architecture</Link>
            <Link href="/admin" className="hover:text-[#202820] transition-colors">Staging Admin</Link>
            <span className="text-[#E8A126] font-medium flex items-center gap-1">
              <span>🇮🇳 Built for Citizens of India</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
