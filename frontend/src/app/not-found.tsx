import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="glass-panel max-w-md w-full rounded-2xl p-8 text-center space-y-6">
        <div className="h-20 w-20 bg-[#F0FDFA] border border-[#0F766E]/15 rounded-full flex items-center justify-center mx-auto text-[#0F766E]">
          <FileQuestion className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-extrabold text-[#0F766E] tracking-tight">404</span>
          <h1 className="text-xl font-bold text-[#111827]">Page Not Found</h1>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            The page or government scheme record you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D5F59] text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Home Page
          </Link>
          <Link
            href="/schemes"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Search className="h-4 w-4" />
            Browse Schemes
          </Link>
        </div>
      </div>
    </div>
  );
}
