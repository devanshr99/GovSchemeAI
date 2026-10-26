import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full rounded-3xl p-8 text-center space-y-6 border border-slate-800 bg-[#111827] shadow-xl">
        <div className="h-16 w-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
          <FileQuestion className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="font-heading text-4xl font-black text-blue-400 tracking-tight">404</span>
          <h1 className="font-heading text-xl font-bold text-slate-100">Scheme Record Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page or government scheme record you are looking for doesn&apos;t exist, has been archived, or was relocated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Home Page</span>
          </Link>
          <Link
            href="/schemes"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0b0f19] hover:bg-[#151c2e] text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold transition-all"
          >
            <Search className="h-4 w-4" />
            <span>Browse Schemes</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
