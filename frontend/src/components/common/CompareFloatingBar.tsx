'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scale, X, ArrowRight } from 'lucide-react';

export const CompareFloatingBar: React.FC = () => {
  const [comparedSlugs, setComparedSlugs] = useState<string[]>([]);

  useEffect(() => {
    const updateCompare = () => {
      if (typeof window !== 'undefined') {
        try {
          const list = JSON.parse(localStorage.getItem('govscheme_compare') || '[]');
          if (Array.isArray(list)) setComparedSlugs(list);
        } catch {
          setComparedSlugs([]);
        }
      }
    };

    updateCompare();
    window.addEventListener('storage', updateCompare);
    const interval = setInterval(updateCompare, 1500);

    return () => {
      window.removeEventListener('storage', updateCompare);
      clearInterval(interval);
    };
  }, []);

  const clearCompare = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('govscheme_compare');
    }
    setComparedSlugs([]);
  };

  const removeSlug = (slugToRemove: string) => {
    const updated = comparedSlugs.filter(s => s !== slugToRemove);
    if (typeof window !== 'undefined') {
      localStorage.setItem('govscheme_compare', JSON.stringify(updated));
    }
    setComparedSlugs(updated);
  };

  if (comparedSlugs.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[92%] sm:w-auto animate-slide-up">
      <div className="gov-card px-4 py-3 rounded-2xl bg-[#0E1422]/95 border border-blue-500/30 shadow-2xl backdrop-blur-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>{comparedSlugs.length} / 3 Schemes Selected</span>
            </div>
            <div className="text-[10px] text-slate-400">Ready for side-by-side comparison</div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="hidden sm:flex items-center gap-1 max-w-[200px] overflow-hidden">
            {comparedSlugs.map(slug => (
              <span 
                key={slug} 
                className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-md text-slate-300 truncate"
              >
                <span className="truncate max-w-[70px]">{slug}</span>
                <button 
                  onClick={() => removeSlug(slug)}
                  className="hover:text-red-400 text-slate-500 cursor-pointer"
                  aria-label={`Remove ${slug}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={clearCompare}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            Clear
          </button>

          <Link
            href="/compare"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1 shadow-sm shrink-0"
          >
            <span>Compare</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompareFloatingBar;
