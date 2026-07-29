'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, ShieldCheck } from 'lucide-react';
import Logo from '../common/Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300 mt-auto pt-12 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-8 border-b border-slate-800">
          {/* Col 1: Brand & Disclaimer */}
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm">G</div>
                <span className="font-bold text-white text-lg">GovScheme<span className="text-blue-400">AI</span></span>
              </div>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              GovSchemeAI is a handcrafted Digital Government Services Platform evaluating citizen eligibility against verified department gazettes.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-950 border border-blue-800 text-[10px] font-bold text-blue-300">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>500+ Active Schemes</span>
            </div>
          </div>

          {/* Col 2: Sector Hubs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Sector Hubs</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/hubs/student" className="hover:text-blue-400 transition-colors">
                  Student & Scholarship Hub
                </Link>
              </li>
              <li>
                <Link href="/hubs/startup" className="hover:text-amber-400 transition-colors">
                  Startup & Entrepreneur Hub
                </Link>
              </li>
              <li>
                <Link href="/hubs/farmer" className="hover:text-emerald-400 transition-colors">
                  Kisan & Agriculture Hub
                </Link>
              </li>
              <li>
                <Link href="/hubs/women" className="hover:text-pink-400 transition-colors">
                  Women Empowerment Hub
                </Link>
              </li>
              <li>
                <Link href="/hubs/youth" className="hover:text-cyan-400 transition-colors">
                  Youth & Skill India Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Portal Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Citizen Services</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="hover:text-blue-400 transition-colors">
                  Citizen Dashboard
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-blue-400 transition-colors">
                  Scheme Comparison Matrix
                </Link>
              </li>
              <li>
                <Link href="/documents" className="hover:text-blue-400 transition-colors">
                  Document Verification Center
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-blue-400 transition-colors">
                  Government News & PIB Feed
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-blue-400 transition-colors">
                  Portal Analytics & Metrics
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Featured Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Categories</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/schemes?category=education" className="hover:text-blue-400 transition-colors">
                  Education & Fellowships
                </Link>
              </li>
              <li>
                <Link href="/schemes?category=agriculture" className="hover:text-blue-400 transition-colors">
                  Crop Credit & Farming Aid
                </Link>
              </li>
              <li>
                <Link href="/schemes?category=business" className="hover:text-blue-400 transition-colors">
                  MSME & Seed Fund
                </Link>
              </li>
              <li>
                <Link href="/schemes?category=health" className="hover:text-blue-400 transition-colors">
                  Health & Ayushman Bharat
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Developer & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Engineering & Lead</h4>
            <p className="text-xs text-slate-400">
              Designed & Built by:
            </p>
            <div className="text-xs text-slate-300 font-medium">
              <Link
                href="/about-developer"
                className="text-blue-400 hover:underline font-bold text-sm"
              >
                Devansh Rastogi
              </Link>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://github.com/devanshr99"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-400 text-slate-300 hover:text-white transition-all"
                aria-label="GitHub Repository"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/devansh-rastogi-a86a83323/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-400 text-slate-300 hover:text-[#0a66c2] transition-all"
                aria-label="LinkedIn Profile"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a
                href="mailto:devanshrastogi993@gmail.com"
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-400 transition-all"
                aria-label="Email Contact"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-medium">
          <div>
            © {new Date().getFullYear()} GovSchemeAI. All Rights Reserved. Digital India Government Portal Platform.
          </div>
          <div className="flex items-center gap-1">
            <span>Lead Engineer:</span>
            <Link href="/about-developer" className="text-white hover:text-blue-400 font-bold underline decoration-blue-500/40">
              Devansh Rastogi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;



