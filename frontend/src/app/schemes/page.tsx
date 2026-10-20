'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import { api } from '../../lib/api';
import Link from 'next/link';
import { SchemeCard as SchemeCardType, Category } from '../../types/scheme';
import { 
  Search, 
  BookOpen, 
  RefreshCw, 
  X, 
  History, 
  TrendingUp, 
  Clock, 
  Scale, 
  BookmarkCheck,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

export default function SchemesBrowse() {
  const { language, t } = useApp();

  // Search and filter states
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [savedOnly, setSavedOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  // Loaded data
  const [schemes, setSchemes] = useState<SchemeCardType[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Search enhancements state with safe lazy initializers
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
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

  const [recentlyViewed, setRecentlyViewed] = useState<SchemeCardType[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const recent = JSON.parse(localStorage.getItem('govscheme_recently_viewed') || '[]');
        return Array.isArray(recent) ? recent : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [compareSlugs, setCompareSlugs] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const compares = JSON.parse(localStorage.getItem('govscheme_compare') || '[]');
        return Array.isArray(compares) ? compares : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isFocused, setIsFocused] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const saveSearchToHistory = useCallback((query: string) => {
    try {
      const history = JSON.parse(localStorage.getItem('govscheme_search_history') || '[]');
      const filtered = history.filter((q: string) => q.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 6);
      localStorage.setItem('govscheme_search_history', JSON.stringify(updated));
      setSearchHistory(updated);
    } catch (err) {
      console.warn('History storage error:', err);
    }
  }, []);

  // Load categories on mount
  useEffect(() => {
    api.getCategories()
      .then((cats) => {
        setCategories(cats);
      })
      .catch(err => console.error('Failed to load categories', err));

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const updateStorageState = () => {
      if (typeof window !== 'undefined') {
        try {
          const compares = JSON.parse(localStorage.getItem('govscheme_compare') || '[]');
          if (Array.isArray(compares)) setCompareSlugs(compares);

          const recent = JSON.parse(localStorage.getItem('govscheme_recently_viewed') || '[]');
          if (Array.isArray(recent)) setRecentlyViewed(recent);
        } catch {
          // Ignore
        }
      }
    };
    window.addEventListener('storage', updateStorageState);
    return () => window.removeEventListener('storage', updateStorageState);
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
    if (search.trim().length < 2) {
      return;
    }
    let isCancelled = false;
    api.getAutocomplete(search.trim())
      .then(data => {
        if (isCancelled) return;
        if (Array.isArray(data)) {
          setSuggestions(data);
        } else if (data && (data as { suggestions?: string[] }).suggestions) {
          setSuggestions((data as { suggestions: string[] }).suggestions);
        }
        setShowSuggestions(true);
      })
      .catch(err => console.error('Failed to fetch suggestions', err));

    return () => { isCancelled = true; };
  }, [search]);

  // Load schemes when filters change
  useEffect(() => {
    let isCurrent = true;
    api.getSchemes({
      page,
      pageSize: 20,
      level: level || undefined,
      category: category || undefined,
      search: debouncedSearch || undefined,
    })
      .then((res) => {
        if (!isCurrent) return;
        if (page === 1) {
          setSchemes(res.schemes);
        } else {
          setSchemes(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const newSchemes = res.schemes.filter(s => !existingIds.has(s.id));
            return [...prev, ...newSchemes];
          });
        }
        setTotal(res.total);
        setError(null);
        setLoading(false);

        if (debouncedSearch.trim() && page === 1 && res.total > 0) {
          saveSearchToHistory(debouncedSearch.trim());
        }
      })
      .catch(err => {
        if (!isCurrent) return;
        console.error('Failed to load schemes:', err);
        setError('Unable to load schemes registry. Please verify backend connection and retry.');
        setLoading(false);
      });

    return () => { isCurrent = false; };
  }, [page, level, category, debouncedSearch, retryCount, saveSearchToHistory]);

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
    setLoading(true);
    setPage(prev => prev + 1);
  };

  const resetAllFilters = () => {
    setSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
    setLevel('');
    setCategory('');
    setSavedOnly(false);
    setLoading(true);
    setPage(1);
  };

  const getFilteredAndSortedSchemes = () => {
    let list = [...schemes];

    if (savedOnly && typeof window !== 'undefined') {
      try {
        const saved: string[] = JSON.parse(localStorage.getItem('govscheme_bookmarks') || '[]');
        list = list.filter(s => saved.includes(s.slug));
      } catch {
        // Ignore
      }
    }

    if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'level-central') {
      list.sort((a, b) => {
        const levelA = a.level?.toLowerCase() === 'central' ? 0 : 1;
        const levelB = b.level?.toLowerCase() === 'central' ? 0 : 1;
        return levelA - levelB;
      });
    } else if (sortBy === 'benefits-high') {
      list.sort((a, b) => {
        const amtA = parseInt(a.benefits_amount?.replace(/[^\d]/g, '') || '0') || 0;
        const amtB = parseInt(b.benefits_amount?.replace(/[^\d]/g, '') || '0') || 0;
        return amtB - amtA;
      });
    }
    return list;
  };

  const popularQueries = ['Farmer', 'Pension', 'Scholarship', 'Women Welfare', 'Mudra Loan', 'Health'];
  const displayedSchemes = getFilteredAndSortedSchemes();
  const hasActiveFilters = Boolean(search || level || category || savedOnly);

  return (
    <div className="mx-auto max-w-7xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
            <BookOpen className="h-4 w-4" />
            <span>Welfare Repository</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-100">
            Browse Government Schemes ({total})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Explore and filter central and state government benefits, eligibility criteria, and application links.
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="space-y-4" ref={containerRef}>
        <div className="gov-card p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center relative border border-white/[0.08]">
          
          {/* Search Input with Autocomplete */}
          <div className="relative md:col-span-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search scheme name, ministry, keyword, or state..."
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                if (val.trim().length < 2) {
                  setSuggestions([]);
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                setIsFocused(true);
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm bg-[#0E1017] border border-white/[0.08] text-slate-100 placeholder-slate-500 focus:border-purple-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label="Clear search text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Suggestions & History Dropdown */}
            {((showSuggestions && suggestions.length > 0) || (isFocused && searchHistory.length > 0 && !search)) && (
              <div className="absolute top-[105%] left-0 right-0 gov-card shadow-2xl p-3 z-30 space-y-3 bg-[#0E1017] border border-white/[0.1] rounded-xl animate-fade-in">
                {!search && searchHistory.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] uppercase font-extrabold tracking-wider text-slate-400 px-1">
                      <span className="flex items-center gap-1">
                        <History className="h-3.5 w-3.5 text-purple-400" />
                        <span>Recent Searches</span>
                      </span>
                      <button 
                        type="button" 
                        onClick={clearHistory} 
                        className="hover:text-rose-400 cursor-pointer text-[10px]"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-1">
                      {searchHistory.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestionClick(q)}
                          className="text-xs bg-[#12141D] hover:bg-[#1A1D2A] text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.06] cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {search && suggestions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 px-1 block mb-1">
                      Suggested Schemes
                    </span>
                    {suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-white/[0.04] text-slate-300 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <TrendingUp className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        <span className="line-clamp-1">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Level Filter */}
          <div className="relative md:col-span-3">
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setLoading(true);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm bg-[#0E1017] border border-white/[0.08] text-slate-100 cursor-pointer focus:border-purple-500"
              aria-label="Filter by government level"
            >
              <option value="">All Government Levels</option>
              <option value="central">Central Government</option>
              <option value="state">State Government</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="relative md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm bg-[#0E1017] border border-white/[0.08] text-slate-100 cursor-pointer focus:border-purple-500"
              aria-label="Sort schemes by"
            >
              <option value="name-asc">Alphabetical (A - Z)</option>
              <option value="name-desc">Alphabetical (Z - A)</option>
              <option value="level-central">Central Schemes First</option>
              <option value="benefits-high">Highest Benefits Amount</option>
            </select>
          </div>
        </div>

        {/* Category Filter Chips & Saved Filter Toggle */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-1.5 items-center">
            <button
              type="button"
              onClick={() => {
                setCategory('');
                setLoading(true);
                setPage(1);
              }}
              className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                category === ''
                  ? 'bg-purple-600 border-purple-500 text-white shadow-xs'
                  : 'bg-[#0E1017] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => {
                  setCategory(cat.slug);
                  setLoading(true);
                  setPage(1);
                }}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-semibold flex items-center gap-1.5 ${
                  category === cat.slug
                    ? 'bg-purple-600 border-purple-500 text-white shadow-xs'
                    : 'bg-[#0E1017] border-white/[0.08] text-slate-300 hover:text-white'
                }`}
              >
                <span>{cat.icon || '📁'}</span>
                <span>{language === 'hi' && cat.name_hi ? cat.name_hi : cat.name}</span>
              </button>
            ))}
          </div>

          {/* Saved Schemes Filter Toggle */}
          <button
            type="button"
            onClick={() => setSavedOnly(!savedOnly)}
            className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
              savedOnly
                ? 'bg-purple-600/25 border-purple-500/50 text-purple-300'
                : 'bg-[#0E1017] border-white/[0.08] text-slate-400 hover:text-white'
            }`}
          >
            <BookmarkCheck className="h-3.5 w-3.5 text-purple-400" />
            <span>Saved Only</span>
          </button>
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 list-container">
        {displayedSchemes.map((scheme) => (
          <SchemeCard
            key={scheme.id}
            scheme={{
              ...scheme,
              match_score: 1.0,
              rules_matched: 0,
              rules_total: 0,
            }}
            isMatchedView={false}
          />
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && page === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="gov-card h-48 rounded-2xl skeleton-shimmer opacity-40 border border-white/[0.08]" />
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="gov-card rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto border border-rose-500/30 bg-[#0E1017]">
          <div className="h-12 w-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-bold text-slate-100">
              Unable to Load Schemes Registry
            </h2>
            <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setRetryCount(c => c + 1);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && displayedSchemes.length === 0 && (
        <div className="gov-card rounded-3xl p-12 text-center space-y-5 max-w-xl mx-auto border border-white/[0.08]">
          <div className="h-14 w-14 bg-[#0E1017] border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Search className="h-7 w-7 text-purple-400" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-heading text-xl font-bold text-slate-100">
              No Matching Schemes Found
            </h2>
            <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
              We couldn&apos;t find schemes matching your active criteria. Try broadening your category or explore popular citizen queries:
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {popularQueries.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSearch(q)}
                className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/15 border border-purple-500/30 text-purple-300 hover:bg-purple-600/25 font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Load More Button */}
      {!loading && schemes.length < total && !savedOnly && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={loadMore}
            className="px-6 py-2.5 bg-[#0E1017] hover:bg-[#161924] text-slate-200 border border-white/[0.08] rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-4 w-4 text-purple-400" />
            <span>{t('loadMore')}</span>
          </button>
        </div>
      )}

      {/* Recently Viewed Schemes Row */}
      {!loading && recentlyViewed.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-slate-200 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" />
              <span>Recently Viewed Schemes</span>
            </h3>
            <span className="text-[11px] text-slate-500">Based on your recent visits</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentlyViewed.map((recent) => (
              <Link
                href={`/schemes/${recent.slug}`}
                key={recent.id}
                className="block gov-card p-4 rounded-xl border border-white/[0.08] hover:border-purple-500/40 transition-all group"
              >
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-purple-400 block mb-1">
                  {recent.category_name || 'General'}
                </span>
                <h4 className="font-heading font-bold text-xs text-slate-200 group-hover:text-purple-300 transition-colors line-clamp-1">
                  {language === 'hi' && recent.name_hi ? recent.name_hi : recent.name}
                </h4>
                {recent.benefits_amount && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1 line-clamp-1">
                    {recent.benefits_amount}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Floating Side-by-Side Comparison Drawer/Bar */}
      {compareSlugs.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-2xl bg-[#0E1017]/95 border border-purple-500/40 shadow-2xl backdrop-blur-md flex items-center gap-4 animate-slide-up">
          <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
            <Scale className="h-4 w-4 text-purple-400" />
            <span>Comparing <strong className="text-white">{compareSlugs.length}</strong> of 3 schemes</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/compare"
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
            >
              <span>Compare Side-by-Side</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('govscheme_compare');
                setCompareSlugs([]);
              }}
              className="text-xs text-slate-400 hover:text-white p-1 cursor-pointer"
              title="Clear comparison list"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
