'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, ShieldCheck, ExternalLink, Heart } from 'lucide-react';
import Logo from '../common/Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.08] bg-[#071126] text-slate-400 mt-auto pt-10 pb-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/[0.06]">
          {/* Col 1: Brand & Disclaimer */}
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <Logo variant="full" size="md" />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              GovSchemeAI is an independent citizen welfare portal designed to evaluate scheme eligibility against official department criteria.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-900/30 border border-blue-500/20 text-[10px] font-semibold text-blue-300">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Verified Government Guidelines</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Portal Services</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-blue-400 transition-colors">
                  Eligibility Checker
                </Link>
              </li>
              <li>
                <Link href="/schemes" className="hover:text-blue-400 transition-colors">
                  Browse All Schemes
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-blue-400 transition-colors">
                  Digital Scheme Advisor
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-blue-400 transition-colors">
                  Admin Control Panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Scheme Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Featured Sectors</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/schemes?category=agriculture" className="hover:text-blue-400 transition-colors">
                  Agriculture & Farmer Welfare
                </Link>
              </li>
              <li>
                <Link href="/schemes?category=education" className="hover:text-blue-400 transition-colors">
                  Education & Scholarships
                </Link>
              </li>
              <li>
                <Link href="/schemes?category=health" className="hover:text-blue-400 transition-colors">
                  Healthcare & Medical Aid
                </Link>
              </li>
              <li>
                <Link href="/schemes?category=business" className="hover:text-blue-400 transition-colors">
                  MSME & Business Subsidies
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Official Resources & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Developer & Contact</h4>
            <p className="text-xs text-slate-400">
              Designed & Engineered with precision for citizen access.
            </p>
            <div className="text-xs text-slate-300 font-medium">
              Lead Architect:{' '}
              <Link
                href="/about-developer"
                className="text-blue-400 hover:underline font-semibold"
              >
                Devansh Rastogi
              </Link>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://github.com/devanshr99"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-900 border border-white/[0.08] hover:border-blue-500/40 text-slate-300 hover:text-white transition-all"
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
                className="p-2 rounded-lg bg-slate-900 border border-white/[0.08] hover:border-blue-500/40 text-slate-300 hover:text-[#0a66c2] transition-all"
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
                className="p-2 rounded-lg bg-slate-900 border border-white/[0.08] hover:border-amber-500/40 text-slate-300 hover:text-amber-400 transition-all"
                aria-label="Email Contact"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-medium">
          <div>
            © {new Date().getFullYear()} GovSchemeAI. All Rights Reserved. Built for Digital Governance & Welfare.
          </div>
          <div className="flex items-center gap-1">
            <span>Crafted with excellence by</span>
            <Link href="/about-developer" className="text-slate-300 hover:text-blue-400 font-semibold underline decoration-blue-500/30">
              Devansh Rastogi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;

