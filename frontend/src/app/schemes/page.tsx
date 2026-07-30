'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import { api } from '../../lib/api';
import Link from 'next/link';
import { SchemeCard as SchemeCardType, Category } from '../../types/scheme';
import { Search, Filter, BookOpen, RefreshCw, X, History, TrendingUp, Sparkles, Clock, ArrowUpDown } from 'lucide-react';

export default function SchemesBrowse() {
  const { language, t } = useApp();

  // Search and filter states
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [page, setPage] = useState<number>(1);

  // Loaded data
  const [schemes, setSchemes] = useState<SchemeCardType[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statesList, setStatesList] = useState<Array<{ code: string; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search enhancements state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<SchemeCardType[]>([]);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load basic configurations, search history, recently viewed
  useEffect(() => {
    Promise.all([api.getCategories(), api.getStates()])
      .then(([cats, states]) => {
        setCategories(cats);
        setStatesList(states);
      })
      .catch(err => console.error('Failed to load filters', err));

    if (typeof window !== 'undefined') {
      const history = JSON.parse(localStorage.getItem('govscheme_search_history') || '[]');
      setSearchHistory(history);

      const recent = JSON.parse(localStorage.getItem('govscheme_recently_viewed') || '[]');
      setRecentlyViewed(recent);
    }

    // Handle clicks outside to close suggestions dropdown
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounce search text
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  // Autocomplete suggestions prefix fetch
  useEffect(() => {
    if (search.trim().length >= 2) {
      fetch(`/api/search/autocomplete?prefix=${encodeURIComponent(search.trim())}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.suggestions) {
            setSuggestions(data.suggestions);
            setShowSuggestions(true);
          }
        })
        .catch(err => console.error('Failed to fetch suggestions', err));
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [search]);

  // Load schemes when filters change
  useEffect(() => {
    setLoading(true);
    api.getSchemes({
      page,
      pageSize: 20,
      level: level || undefined,
      state: state || undefined,
      category: category || undefined,
      search: debouncedSearch || undefined,
    })
      .then((res) => {
        if (page === 1) {
          setSchemes(res.schemes);
        } else {
          setSchemes(prev => {
            // deduplicate
            const existingIds = new Set(prev.map(s => s.id));
            const newSchemes = res.schemes.filter(s => !existingIds.has(s.id));
            return [...prev, ...newSchemes];
          });
        }
        setTotal(res.total);

        // Save successful search query to history
        if (debouncedSearch.trim() && page === 1 && res.total > 0) {
          saveSearchToHistory(debouncedSearch.trim());
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [page, level, state, category, debouncedSearch]);

  const saveSearchToHistory = (query: string) => {
    const history = JSON.parse(localStorage.getItem('govscheme_search_history') || '[]');
    const filtered = history.filter((q: string) => q.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, 6);
    localStorage.setItem('govscheme_search_history', JSON.stringify(updated));
    setSearchHistory(updated);
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.removeItem('govscheme_search_history');
    setSearchHistory([]);
  };

  const handleSuggestionClick = (val: string) => {
    setSearch(val);
    setShowSuggestions(false);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  // Perform Client-side sorting on loaded schemes
  const getSortedSchemes = () => {
    const sorted = [...schemes];
    if (sortBy === 'name-asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'level-central') {
      sorted.sort((a, b) => {
        const levelA = a.level?.toLowerCase() === 'central' ? 0 : 1;
        const levelB = b.level?.toLowerCase() === 'central' ? 0 : 1;
        return levelA - levelB;
      });
    } else if (sortBy === 'benefits-high') {
      sorted.sort((a, b) => {
        const amtA = parseInt(a.benefits_amount?.replace(/[^\d]/g, '') || '0') || 0;
        const amtB = parseInt(b.benefits_amount?.replace(/[^\d]/g, '') || '0') || 0;
        return amtB - amtA;
      });
    }
    return sorted;
  };

  const popularQueries = ['Farmer', 'Pension', 'Scholarship', 'Women', 'Health', 'Awas'];

  return (
    <div className="mx-auto max-w-5xl w-full py-12 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-blue-400" />
          {t('browseSchemes')}
        </h1>
        <p className="text-xs text-slate-400">
          Find verified government welfare programs. Apply directly or check eligibility.
        </p>
      </div>

      {/* Filter and Search Panel */}
      <div className="space-y-4" ref={containerRef}>
        <div className="glass-panel rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-center relative">
          
          {/* Search Input and Suggestions */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setSuggestions([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Suggestions & History Dropdown */}
            {((showSuggestions && suggestions.length > 0) || (isFocused && searchHistory.length > 0 && !search)) && (
              <div className="absolute top-[105%] left-0 right-0 glass-panel rounded-2xl border border-white/[0.08] shadow-2xl p-3 z-30 space-y-3">
                {/* Search History */}
                {!search && searchHistory.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-500 px-1">
                      <span className="flex items-center gap-1">
                        <History className="h-3.5 w-3.5" /> Recent Searches
                      </span>
                      <button onClick={clearHistory} className="hover:text-red-400 cursor-pointer">Clear All</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-1">
                      {searchHistory.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(q)}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-white/[0.04] cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions List */}
                {search && suggestions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-1 block mb-1">
                      Matching Suggestions
                    </span>
                    {suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-white/[0.04] text-slate-300 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                        <span className="line-clamp-1">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Level Filter */}
          <div className="relative">
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl text-sm appearance-none cursor-pointer"
            >
              <option value="">{t('filterLevel')}</option>
              <option value="central">{t('central')}</option>
              <option value="state">{t('state')}</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm appearance-none cursor-pointer"
            >
              <option value="name-asc">Alphabetical (A - Z)</option>
              <option value="name-desc">Alphabetical (Z - A)</option>
              <option value="level-central">Central Schemes First</option>
              <option value="benefits-high">Highest Benefits Amount</option>
            </select>
          </div>
        </div>

        {/* Category filter chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center bg-white/[0.01] p-2 rounded-2xl border border-white/[0.04]">
            <button
              onClick={() => {
                setCategory('');
                setPage(1);
              }}
              className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                category === ''
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-white'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => {
                  setCategory(cat.slug);
                  setPage(1);
                }}
                className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                  category === cat.slug
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <span>{cat.icon || '📁'}</span>
                <span>{language === 'hi' && cat.name_hi ? cat.name_hi : cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Schemes Grid */}
      <div className="space-y-6">
        {getSortedSchemes().map((scheme) => (
          <SchemeCard
            key={scheme.id}
            scheme={{
              ...scheme,
              match_score: 1.0,
              rules_matched: 0,
              rules_total: 0,
            } as any}
            isMatchedView={false}
          />
        ))}

        {/* Loading skeleton */}
        {loading && page === 1 && (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="glass-panel h-28 rounded-2xl skeleton-shimmer opacity-40" />
            ))}
          </div>
        )}

        {/* No Results Page */}
        {!loading && schemes.length === 0 && (
          <div className="glass-panel rounded-3xl p-12 text-center space-y-6 max-w-xl mx-auto border border-white/[0.06]">
            <div className="h-16 w-16 bg-slate-800 border border-white/[0.08] rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100">No Schemes Found</h2>
              <p className="text-slate-400 text-sm">
                We couldn't find any schemes matching your filters or search query. Try searching for these popular items instead:
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {popularQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearch(q)}
                  className="text-xs px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <TrendingUp className="h-3 w-3" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Load More Button */}
        {!loading && schemes.length < total && (
          <div className="flex justify-center pt-4">
            <button
              onClick={loadMore}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/[0.08] hover:border-white/20 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              {t('loadMore')}
            </button>
          </div>
        )}
      </div>

      {/* Recently Viewed schemes row */}
      {!loading && recentlyViewed.length > 0 && (
        <div className="space-y-4 pt-10 border-t border-white/[0.08]">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            Recently Viewed Schemes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentlyViewed.map((recent) => (
              <Link
                href={`/schemes/${recent.slug}`}
                key={recent.id}
                className="block glass-panel p-4 rounded-xl border border-white/[0.06] hover:border-blue-500/20 hover:bg-white/[0.01] transition-all group"
              >
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-blue-400 block mb-1">
                  {recent.category_name || 'General'}
                </span>
                <h4 className="font-bold text-xs text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1">
                  {language === 'hi' && recent.name_hi ? recent.name_hi : recent.name}
                </h4>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
