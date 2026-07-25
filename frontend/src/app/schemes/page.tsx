'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import { api } from '../../lib/api';
import Link from 'next/link';
import { SchemeCard as SchemeCardType, Category } from '../../types/scheme';
import { Search, BookOpen, RefreshCw, X, History, TrendingUp, Clock } from 'lucide-react';

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

  // Autocomplete suggestions
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

  // Fetch schemes
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
            const existingIds = new Set(prev.map(s => s.id));
            const newSchemes = res.schemes.filter(s => !existingIds.has(s.id));
            return [...prev, ...newSchemes];
          });
        }
        setTotal(res.total);

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
        <h1 className="text-3xl font-extrabold text-[#101828] flex items-center gap-2.5">
          <BookOpen className="h-7 w-7 text-[#2563EB]" />
          {t('browseSchemes')}
        </h1>
        <p className="text-sm text-[#667085]">
          Find verified government welfare programs. Apply directly or check eligibility.
        </p>
      </div>

      {/* Filter and Search Panel */}
      <div className="space-y-4" ref={containerRef}>
        <div className="glass-panel rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-center relative">
          
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3]" />
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#101828] p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Suggestions & History Dropdown */}
            {((showSuggestions && suggestions.length > 0) || (isFocused && searchHistory.length > 0 && !search)) && (
              <div className="absolute top-[105%] left-0 right-0 bg-white rounded-2xl border border-[#E4E7EC] shadow-xl p-3.5 z-30 space-y-3">
                {!search && searchHistory.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] uppercase font-semibold tracking-wider text-[#98A2B3] px-1">
                      <span className="flex items-center gap-1">
                        <History className="h-3.5 w-3.5" /> Recent Searches
                      </span>
                      <button onClick={clearHistory} className="hover:text-[#F04438] cursor-pointer">Clear All</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-1">
                      {searchHistory.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(q)}
                          className="text-xs bg-[#F2F4F7] hover:bg-[#EAECF0] text-[#344054] px-3 py-1.5 rounded-lg border border-[#E4E7EC] cursor-pointer transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {search && suggestions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-[#98A2B3] px-1 block mb-1">
                      Matching Suggestions
                    </span>
                    {suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#F2F4F7] text-[#344054] hover:text-[#101828] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <TrendingUp className="h-3.5 w-3.5 text-[#2563EB]" />
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
          <div className="flex flex-wrap gap-2 items-center bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E4E7EC]">
            <button
              onClick={() => {
                setCategory('');
                setPage(1);
              }}
              className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer font-semibold ${
                category === ''
                  ? 'bg-[#2563EB] border-[#2563EB] text-white'
                  : 'bg-white border-[#E4E7EC] text-[#667085] hover:text-[#101828] hover:border-[#D0D5DD]'
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
                className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer font-semibold flex items-center gap-1.5 ${
                  category === cat.slug
                    ? 'bg-[#2563EB] border-[#2563EB] text-white'
                    : 'bg-white border-[#E4E7EC] text-[#667085] hover:text-[#101828] hover:border-[#D0D5DD]'
                }`}
              >
                <span>{cat.icon || '📁'}</span>
                <span>{language === 'hi' && cat.name_hi ? cat.name_hi : cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Schemes List */}
      <div className="space-y-5">
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

        {loading && page === 1 && (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="glass-panel h-28 rounded-2xl skeleton-shimmer opacity-60" />
            ))}
          </div>
        )}

        {!loading && schemes.length === 0 && (
          <div className="glass-panel rounded-2xl p-12 text-center space-y-6 max-w-xl mx-auto">
            <div className="h-16 w-16 bg-[#F2F4F7] border border-[#E4E7EC] rounded-full flex items-center justify-center mx-auto text-[#98A2B3]">
              <Search className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#101828]">No Schemes Found</h2>
              <p className="text-[#667085] text-sm">
                We couldn&apos;t find any schemes matching your filters or search query. Try searching for these popular items instead:
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {popularQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearch(q)}
                  className="text-xs px-3.5 py-2 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/15 text-[#2563EB] hover:bg-[#DBEAFE] font-semibold transition-all cursor-pointer flex items-center gap-1"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && schemes.length < total && (
          <div className="flex justify-center pt-4">
            <button
              onClick={loadMore}
              className="px-6 py-2.5 bg-white hover:bg-[#F8FAFC] text-[#344054] border border-[#E4E7EC] hover:border-[#D0D5DD] rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              {t('loadMore')}
            </button>
          </div>
        )}
      </div>

      {/* Recently Viewed schemes row */}
      {!loading && recentlyViewed.length > 0 && (
        <div className="space-y-4 pt-10 border-t border-[#E4E7EC]">
          <h3 className="text-base font-bold text-[#101828] flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-[#2563EB]" />
            Recently Viewed Schemes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentlyViewed.map((recent) => (
              <Link
                href={`/schemes/${recent.slug}`}
                key={recent.id}
                className="block glass-panel p-4 rounded-xl hover:border-[#2563EB]/30 hover:bg-[#FAFAFA] transition-all group"
              >
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#2563EB] block mb-1">
                  {recent.category_name || 'General'}
                </span>
                <h4 className="font-semibold text-xs text-[#101828] group-hover:text-[#2563EB] transition-colors line-clamp-1">
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
