'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';

export const Footer: React.FC = () => {
  const { t } = useApp();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.08] bg-[#0f172a]/40 py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-400">
              © {currentYear} <span className="text-orange-400">GovScheme</span><span className="text-blue-400">AI</span>. All rights reserved.
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-md text-center sm:text-right">
            Disclaimer: GovSchemeAI matches schemes based on deterministic rules and AI explanations. Please confirm all details on official portals before applying.
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
