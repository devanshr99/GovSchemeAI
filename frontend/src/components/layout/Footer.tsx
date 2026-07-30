'use client';

import React from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0f172a]/80 backdrop-blur-md py-6 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-400 font-medium">
          Made with ❤️ by{' '}
          <Link
            href="/about-developer"
            className="text-slate-200 hover:text-blue-400 font-semibold transition-colors duration-200 underline decoration-blue-500/30 decoration-2 underline-offset-4 hover:decoration-blue-400"
          >
            Devansh Rastogi
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/devanshr99"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-200 transition-colors duration-200 p-1.5 rounded-lg hover:bg-white/[0.04]"
            aria-label="GitHub"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/in/devansh-rastogi-a86a83323/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-[#0a66c2] transition-colors duration-200 p-1.5 rounded-lg hover:bg-white/[0.04]"
            aria-label="LinkedIn"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect width="4" height="12" x="2" y="9" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
          <a
            href="mailto:devanshrastogi993@gmail.com"
            className="text-slate-400 hover:text-orange-400 transition-colors duration-200 p-1.5 rounded-lg hover:bg-white/[0.04]"
            aria-label="Email"
          >
            <Mail className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
