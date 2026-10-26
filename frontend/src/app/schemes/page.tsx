'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import { SlideOver } from '../../components/common/SlideOver';
import { CompareFloatingBar } from '../../components/common/CompareFloatingBar';
import { api } from '../../lib/api';
import Link from 'next/link';
import { SchemeCard as SchemeCardType, Category } from '../../types/scheme';
import { 
  Search, 
  BookOpen, 
  RefreshCw, 
  X, 
  BookmarkCheck,
  AlertTriangle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function SchemesBrowse() {
  const { language, t } = useApp();

  // Search and filter states
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [savedOnly, setSavedOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  // Filter drawer state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false);

  // Loaded data
  const [schemes, setSchemes] = useState<SchemeCardType[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statesList, setStatesList] = useState<Array<{ code: string; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Search history
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const history = JSON.parse(localStorage.getItem('govscheme_search_history') || '[]');
        return Array.isArray(history) ? history : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const saveSearchToHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    try {
      const history = JSON.parse(localStorage.getItem('govscheme_search_history') || '[]');
      const filtered = history.filter((q: string) => q.toLowerCase() !== query.toLowerCase());
      const updated = [query.trim(), ...filtered].slice(0, 6);
      localStorage.setItem('govscheme_search_history', JSON.stringify(updated));
      setSearchHistory(updated);
    } catch (err) {
      console.warn('History storage error:', err);
    }
  }, []);

  // Load categories and states on mount
  useEffect(() => {
    api.getCategories()
      .then(cats => setCategories(cats))
      .catch(err => console.error('Failed to load categories', err));

    api.getStates()
      .then(states => setStatesList(states))
      .catch(err => console.error('Failed to load states', err));
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      if (search.trim().length > 2) {
        saveSearchToHistory(search.trim());
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search, saveSearchToHistory]);

  // Main Scheme Fetch Effect
  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError(null);

    const savedSlugs: string[] = savedOnly && typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]')
      : [];

    api.getSchemes({
      search: debouncedSearch,
      category: category,
      level: level || undefined,
      state: selectedState || undefined,
      page,
      pageSize,
      activeOnly: true,
    })
      .then(res => {
        if (!isCurrent) return;
        if (savedOnly) {
          const filtered = res.schemes.filter(s => savedSlugs.includes(s.slug));
          setSchemes(filtered);
          setTotal(filtered.length);
        } else {
          setSchemes(res.schemes);
          setTotal(res.total);
        }
      })
      .catch(err => {
        if (!isCurrent) return;
        console.error('Failed to load schemes:', err);
        setError('Unable to fetch schemes from government catalog. Please try again.');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => { isCurrent = false; };
  }, [debouncedSearch, category, level, selectedState, page, sortBy, savedOnly, retryCount]);

  const activeFilterCount = [
    category,
    level,
    selectedState,
    savedOnly ? 'saved' : null
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('');
    setLevel('');
    setSelectedState('');
    setSavedOnly(false);
    setSortBy('name-asc');
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-7xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-6 relative z-10 animate-fade-in">
      
      {/* Compare Floating Tray */}
      <CompareFloatingBar />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#E5E9E3] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B52] bg-[#E7F3EC] px-2.5 py-0.5 rounded-full">
            <BookOpen className="h-3.5 w-3.5" />
            <span>National Welfare Catalog</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#202820] mt-2">
            Government Schemes Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#687368] mt-1">
            Browse and filter verified welfare programs, scholarships, and financial grants across India.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Saved Schemes Filter Toggle */}
          <button
            type="button"
            onClick={() => { setSavedOnly(!savedOnly); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              savedOnly
                ? 'bg-[#FAF5E9] text-[#E8A126] border-[#F3E7CA] shadow-xs'
                : 'bg-white text-[#202820] border-[#E5E9E3] hover:border-[#176B52]/40'
            }`}
          >
            <BookmarkCheck className="h-4 w-4 text-[#E8A126]" />
            <span>Saved Schemes</span>
          </button>

          {/* Filter Drawer Trigger Button */}
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#176B52] hover:bg-[#124C3D] text-white shadow-xs transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-[#176B52]">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search Bar */}
        <div className="md:col-span-8 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A968A] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by scheme name, ministry, or benefit keywords (e.g., KISAN, scholarship)..."
            className="w-full pl-10 pr-10 py-3 rounded-xl text-xs sm:text-sm bg-white border border-[#E5E9E3] text-[#202820] placeholder-[#8A968A] focus:border-[#176B52] focus:outline-none shadow-xs transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A968A] hover:text-[#202820]"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div className="md:col-span-4 flex items-center gap-2">
          <span className="text-xs text-[#687368] shrink-0 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="w-full py-2.5 px-3 rounded-xl text-xs bg-white border border-[#E5E9E3] text-[#202820] focus:border-[#176B52] focus:outline-none shadow-xs"
          >
            <option value="name-asc">Name (A to Z)</option>
            <option value="name-desc">Name (Z to A)</option>
            <option value="level">Level (Central first)</option>
            <option value="recent">Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Quick Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => { setCategory(''); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            category === ''
              ? 'bg-[#176B52] text-white shadow-xs'
              : 'bg-white text-[#202820] hover:text-[#176B52] border border-[#E5E9E3]'
          }`}
        >
          All Schemes
        </button>
        {categories.map((cat) => {
          const isSelected = category === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => { setCategory(isSelected ? '' : cat.slug); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#176B52] text-white shadow-xs'
                  : 'bg-white text-[#202820] hover:text-[#176B52] border border-[#E5E9E3] hover:border-[#176B52]/40'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Active Filter Indicators */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2 py-2 px-3 bg-white border border-[#E5E9E3] rounded-xl text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#687368] font-medium">Active Filters:</span>
            {category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E7F3EC] border border-[#176B52]/20 text-[#176B52] text-[11px] font-semibold">
                Category: {category}
                <button onClick={() => setCategory('')} className="hover:text-[#124C3D]"><X className="h-3 w-3" /></button>
              </span>
            )}
            {level && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF5E9] border border-[#F3E7CA] text-[#E8A126] text-[11px] font-semibold">
                Level: {level}
                <button onClick={() => setLevel('')} className="hover:text-[#8C6212]"><X className="h-3 w-3" /></button>
              </span>
            )}
            {selectedState && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E7F3EC] border border-[#176B52]/20 text-[#176B52] text-[11px] font-semibold">
                State: {selectedState}
                <button onClick={() => setSelectedState('')} className="hover:text-[#124C3D]"><X className="h-3 w-3" /></button>
              </span>
            )}
            {savedOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF5E9] border border-[#F3E7CA] text-[#E8A126] text-[11px] font-semibold">
                Saved Only
                <button onClick={() => setSavedOnly(false)} className="hover:text-[#8C6212]"><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-xs text-[#687368] hover:text-[#176B52] font-semibold underline underline-offset-2 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Schemes Results Summary */}
      <div className="flex items-center justify-between text-xs text-[#687368] font-medium pt-1">
        <span>
          Showing {schemes.length} of {total} verified government schemes
        </span>
        {totalPages > 1 && (
          <span>Page {page} of {totalPages}</span>
        )}
      </div>

      {/* Main Schemes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-[#E5E9E3] space-y-4 shadow-xs">
              <div className="h-4 w-28 rounded bg-[#F7F8F5] animate-pulse" />
              <div className="h-6 w-3/4 rounded bg-[#F7F8F5] animate-pulse" />
              <div className="h-12 w-full rounded-xl bg-[#F7F8F5] animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-[#F7F8F5] animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center rounded-2xl border border-red-200 space-y-4 max-w-lg mx-auto bg-white shadow-xs">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
          <h3 className="font-heading text-lg font-bold text-[#202820]">Unable to Load Schemes</h3>
          <p className="text-xs text-[#687368] leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={() => setRetryCount(prev => prev + 1)}
            className="px-5 py-2.5 bg-[#176B52] hover:bg-[#124C3D] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : schemes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-[#E5E9E3] space-y-4 max-w-lg mx-auto bg-white shadow-xs">
          <BookOpen className="h-10 w-10 text-[#8A968A] mx-auto" />
          <h3 className="font-heading text-lg font-bold text-[#202820]">No Matching Schemes Found</h3>
          <p className="text-xs text-[#687368] leading-relaxed">
            We couldn&apos;t find any government schemes matching your active criteria. Try broadening your search or resetting filters.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-5 py-2.5 bg-[#176B52] hover:bg-[#124C3D] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme) => (
            <SchemeCard
              key={scheme.slug}
              scheme={{
                ...scheme,
                match_score: 1.0,
                rules_matched: 1,
                rules_total: 1,
              }}
              isMatchedView={false}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E5E9E3] text-[#202820] hover:text-[#176B52] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-semibold text-[#687368] px-3">
            {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E5E9E3] text-[#202820] hover:text-[#176B52] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter Slide-Over Drawer */}
      <SlideOver
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Government Schemes"
        subtitle="Narrow by jurisdiction, ministry category, and state"
      >
        <div className="space-y-6">
          {/* Level Filter */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#202820] block">
              Jurisdiction Level
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLevel('')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-colors cursor-pointer ${
                  level === ''
                    ? 'bg-[#176B52] text-white border-[#176B52]'
                    : 'bg-[#F7F8F5] text-[#202820] border-[#E5E9E3] hover:border-[#176B52]/40'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setLevel('Central')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-colors cursor-pointer ${
                  level === 'Central'
                    ? 'bg-[#176B52] text-white border-[#176B52]'
                    : 'bg-[#F7F8F5] text-[#202820] border-[#E5E9E3] hover:border-[#176B52]/40'
                }`}
              >
                Central
              </button>
              <button
                type="button"
                onClick={() => setLevel('State')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-colors cursor-pointer ${
                  level === 'State'
                    ? 'bg-[#176B52] text-white border-[#176B52]'
                    : 'bg-[#F7F8F5] text-[#202820] border-[#E5E9E3] hover:border-[#176B52]/40'
                }`}
              >
                State
              </button>
            </div>
          </div>

          {/* State & Territory Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#202820] block">
              State / Union Territory
            </span>
            <select
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
              className="w-full py-2.5 px-3 rounded-xl text-xs bg-[#F7F8F5] border border-[#E5E9E3] text-[#202820] focus:border-[#176B52] focus:outline-none"
            >
              <option value="">All States & UTs (Pan-India)</option>
              {statesList.map(st => (
                <option key={st.code} value={st.code}>{st.name} ({st.code})</option>
              ))}
            </select>
          </div>

          {/* Ministry / Category Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#202820] block">
              Ministry Category
            </span>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full py-2.5 px-3 rounded-xl text-xs bg-[#F7F8F5] border border-[#E5E9E3] text-[#202820] focus:border-[#176B52] focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Bottom Action inside drawer */}
          <div className="pt-6 border-t border-[#E5E9E3] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-4 py-2 text-xs font-semibold text-[#687368] hover:text-[#202820] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(false)}
              className="px-5 py-2.5 bg-[#176B52] hover:bg-[#124C3D] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Apply ({activeFilterCount})
            </button>
          </div>
        </div>
      </SlideOver>

    </div>
  );
}
