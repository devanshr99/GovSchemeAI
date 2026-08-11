import React from 'react';
import Link from 'next/link';
import { Logo } from '../common/Logo';
import { ShieldCheck, ExternalLink, Globe, Heart, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#242832] bg-[#08090D] text-[#A1A1AA] pt-12 pb-8 relative z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-[#242832]/80">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <Logo variant="full" size="lg" />
            </Link>
            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed max-w-md">
              GovSchemeAI is an independent, citizen-first discovery platform connecting millions of Indian citizens to central and state government benefits, welfare schemes, and subsidies through intelligent profile matching.
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="h-4 w-4" />
              <span>100% Direct Official Source Indexing</span>
            </div>
          </div>

          {/* Quick Discovery */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F7]">Platform Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-[#A855F7] transition-colors flex items-center gap-1">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/schemes" className="hover:text-[#A855F7] transition-colors flex items-center gap-1">
                  Browse All Schemes
                </Link>
              </li>
              <li>
                <Link href="/eligibility" className="hover:text-[#A855F7] transition-colors flex items-center gap-1">
                  Eligibility Checker
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-[#A855F7] transition-colors flex items-center gap-1">
                  Citizen Scheme Advisor AI
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#A855F7] transition-colors flex items-center gap-1">
                  Citizen Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Sector Hubs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F7]">Sector Hubs</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/hubs/student" className="hover:text-[#A855F7] transition-colors">
                  Student & Scholarships
                </Link>
              </li>
              <li>
                <Link href="/hubs/startup" className="hover:text-[#A855F7] transition-colors">
                  Startup & Business Grants
                </Link>
              </li>
              <li>
                <Link href="/hubs/farmer" className="hover:text-[#A855F7] transition-colors">
                  Farmers & Agriculture
                </Link>
              </li>
              <li>
                <Link href="/hubs/women" className="hover:text-[#A855F7] transition-colors">
                  Women Welfare & Health
                </Link>
              </li>
              <li>
                <Link href="/hubs/msme" className="hover:text-[#A855F7] transition-colors">
                  MSME & Micro Enterprises
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Portals & Verification */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F7]">Official Portals</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://www.myscheme.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-[#A855F7] transition-colors flex items-center gap-1 group"
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
                  className="hover:text-[#A855F7] transition-colors flex items-center gap-1 group"
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
                  className="hover:text-[#A855F7] transition-colors flex items-center gap-1 group"
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
                  className="hover:text-[#A855F7] transition-colors flex items-center gap-1 group"
                >
                  <span>National Scholarship Portal</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <Link href="/about-developer" className="hover:text-[#A855F7] transition-colors">
                  Developer & Architecture Info
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory Legal Disclaimer Banner */}
        <div className="py-5 my-6 px-4 rounded-xl bg-[#0D0F14] border border-[#242832] text-xs text-[#71717A] leading-relaxed">
          <p className="font-semibold text-[#A1A1AA] mb-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />
            Official Verification Disclaimer
          </p>
          <p>
            GovSchemeAI is an independent platform created for discovering Central and State Government schemes. Information is aggregated from official public government sources for guidance purposes. Citizens are strongly advised to verify final eligibility requirements, document guidelines, and deadlines on official government domain portals (ending in .gov.in or .nic.in) before applying.
          </p>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <p>© {new Date().getFullYear()} GovSchemeAI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/about-developer" className="hover:text-[#A1A1AA] transition-colors">System Architecture</Link>
            <Link href="/admin" className="hover:text-[#A1A1AA] transition-colors">Staging Admin</Link>
            <span className="text-[#8B5CF6] font-medium">Made for Citizens of India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
