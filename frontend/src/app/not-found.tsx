import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="gov-card max-w-md w-full rounded-3xl p-8 text-center space-y-6 border border-white/[0.08] bg-[#0E1017]">
        <div className="h-16 w-16 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto text-purple-400">
          <FileQuestion className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="font-heading text-4xl font-black text-purple-400 tracking-tight">404</span>
          <h1 className="font-heading text-xl font-bold text-slate-100">Scheme Record Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page or government scheme record you are looking for doesn&apos;t exist, has been archived, or was moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Home Page</span>
          </Link>
          <Link
            href="/schemes"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#12141D] hover:bg-[#1A1E2B] text-slate-200 border border-white/[0.08] rounded-xl text-xs font-bold transition-all"
          >
            <Search className="h-4 w-4" />
            <span>Browse Schemes</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
