'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import { api } from '../../lib/api';
import { SchemeCard as SchemeCardType, Category } from '../../types/scheme';
import { Search, Filter, BookOpen, Layers, RefreshCw } from 'lucide-react';

export default function SchemesBrowse() {
  const { language, t } = useApp();

  // Search and filter states
  const [search, setSearch] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Loaded data
  const [schemes, setSchemes] = useState<SchemeCardType[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statesList, setStatesList] = useState<Array<{ code: string; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load categories and states on mount
  useEffect(() => {
    Promise.all([api.getCategories(), api.getStates()])
      .then(([cats, states]) => {
        setCategories(cats);
        setStatesList(states);
      })
      .catch(err => console.error('Failed to load filters', err));
  }, []);

  // Load schemes when filters or page changes
  useEffect(() => {
    setLoading(true);
    api.getSchemes({
      page,
      pageSize: 10,
      level: level || undefined,
      state: state || undefined,
      category: category || undefined,
      search: search || undefined,
    })
      .then((res) => {
        if (page === 1) {
          setSchemes(res.schemes);
        } else {
          setSchemes(prev => [...prev, ...res.schemes]);
        }
        setTotal(res.total);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [page, level, state, category, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset page on new search
  };

  const handleFilterChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1); // Reset page on filter change
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <div className="mx-auto max-w-5xl w-full py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-blue-400" />
          {t('browseSchemes')}
        </h1>
        <p className="text-xs text-slate-400">
          Find any government scheme in India. Use search and filters to refine results.
        </p>
      </div>

      {/* Filter controls */}
      <div className="glass-panel rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>

        {/* Level */}
        <div className="relative">
          <select
            value={level}
            onChange={handleFilterChange(setLevel)}
            className="w-full px-3 py-2.5 rounded-xl text-sm appearance-none cursor-pointer"
          >
            <option value="">{t('filterLevel')}</option>
            <option value="central">{t('central')}</option>
            <option value="state">{t('state')}</option>
          </select>
        </div>

        {/* Category */}
        <div className="relative">
          <select
            value={category}
            onChange={handleFilterChange(setCategory)}
            className="w-full px-3 py-2.5 rounded-xl text-sm appearance-none cursor-pointer"
          >
            <option value="">{t('filterCategory')}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {language === 'hi' && c.name_hi ? c.name_hi : c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="space-y-6">
        {schemes.map((scheme) => (
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

        {/* Loading / Empty States */}
        {loading && page === 1 && (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="glass-panel h-28 rounded-2xl skeleton-shimmer opacity-40" />
            ))}
          </div>
        )}

        {!loading && schemes.length === 0 && (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-400">
            {t('noSchemesFound')}
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
    </div>
  );
}
