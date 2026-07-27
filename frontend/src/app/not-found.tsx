import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="glass-panel max-w-md w-full rounded-2xl p-8 text-center space-y-6 border border-white/[0.08]">
        <div className="h-20 w-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto text-blue-400">
          <FileQuestion className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-extrabold text-blue-400 tracking-tight">404</span>
          <h1 className="text-xl font-bold text-slate-100">Page Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page or government scheme record you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Home Page
          </Link>
          <Link
            href="/schemes"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] rounded-xl text-xs font-bold transition-all"
          >
            <Search className="h-4 w-4" />
            Browse Schemes
          </Link>
        </div>
      </div>
    </div>
  );
}

