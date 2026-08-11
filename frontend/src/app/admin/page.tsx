'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { SchemeCard, Category } from '../../types/scheme';
import { Plus, Settings, BarChart2, Eye, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ActionFeedback {
  type: 'success' | 'error';
  message: string;
}

export default function AdminPanel() {
  const [schemes, setSchemes] = useState<SchemeCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const [activeCount, setActiveCount] = useState<number>(0);
  const [centralCount, setCentralCount] = useState<number>(0);
  const [stateCount, setStateCount] = useState<number>(0);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getSchemes({ page: 1, pageSize: 1000, activeOnly: false }),
      api.getCategories()
    ])
      .then(([schemesRes, cats]) => {
        setSchemes(schemesRes.schemes);
        setTotal(schemesRes.total);
        setCategories(cats);
        setActiveCount(schemesRes.schemes.filter(s => s.is_active).length);
        setCentralCount(schemesRes.schemes.filter(s => s.level === 'central').length);
        setStateCount(schemesRes.schemes.filter(s => s.level === 'state').length);
      })
      .catch(err => {
        console.error(err);
        showFeedback('error', 'Failed to load schemes. Is the backend running?');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleSchemeStatus = async (id: string, currentStatus: boolean) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    const newStatus = !currentStatus;
    try {
      const res = await fetch(`/api/schemes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setSchemes(prev => prev.map(s => s.id === id ? { ...s, is_active: newStatus } : s));
      if (newStatus) setActiveCount(c => c + 1);
      else setActiveCount(c => c - 1);
      showFeedback('success', `Scheme ${newStatus ? 'activated' : 'deactivated'} successfully.`);
    } catch (err) {
      console.error('Toggle failed:', err);
      showFeedback('error', 'Failed to update scheme status.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const deleteScheme = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    setActionLoading(prev => ({ ...prev, [`del_${id}`]: true }));
    try {
      const res = await fetch(`/api/schemes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setSchemes(prev => {
        const removed = prev.find(s => s.id === id);
        if (removed?.is_active) setActiveCount(c => c - 1);
        if (removed?.level === 'central') setCentralCount(c => c - 1);
        if (removed?.level === 'state') setStateCount(c => c - 1);
        return prev.filter(s => s.id !== id);
      });
      setTotal(t => t - 1);
      showFeedback('success', `Scheme "${name}" deleted successfully.`);
    } catch (err) {
      console.error('Delete failed:', err);
      showFeedback('error', 'Failed to delete scheme.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`del_${id}`]: false }));
    }
  };

  return (
    <div className="mx-auto max-w-6xl w-full py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#242832] pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#F5F5F7] flex items-center gap-2">
            <Settings className="h-7 w-7 text-[#A855F7]" />
            GovSchemeAI Admin Panel
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            System administration, health monitoring, and scheme status toggles.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/updates"
            className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-bold transition-all"
          >
            <Settings className="h-4 w-4" />
            Staging Pipeline
          </Link>
          <Link
            href="/schemes"
            className="flex items-center gap-2 px-4 py-2 bg-[#101217] hover:bg-[#141720] border border-[#242832] text-[#F5F5F7] rounded-xl text-xs font-bold transition-all"
          >
            <Plus className="h-4 w-4" />
            Browse All Schemes
          </Link>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-xs font-semibold animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22C55E]" />
            : <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          }
          {feedback.message}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="gov-card p-5 rounded-2xl border-[#242832] space-y-1">
          <div className="text-[9px] uppercase font-extrabold tracking-wider text-[#71717A]">Total Registry</div>
          <div className="text-3xl font-black text-[#F5F5F7]">{total}</div>
        </div>

        <div className="gov-card p-5 rounded-2xl border-[#242832] space-y-1">
          <div className="text-[9px] uppercase font-extrabold tracking-wider text-[#71717A]">Active Matching</div>
          <div className="text-3xl font-black text-[#22C55E]">{activeCount}</div>
        </div>

        <div className="gov-card p-5 rounded-2xl border-[#242832] space-y-1">
          <div className="text-[9px] uppercase font-extrabold tracking-wider text-[#71717A]">Central Level</div>
          <div className="text-3xl font-black text-[#A855F7]">{centralCount}</div>
        </div>

        <div className="gov-card p-5 rounded-2xl border-[#242832] space-y-1">
          <div className="text-[9px] uppercase font-extrabold tracking-wider text-[#71717A]">State Level</div>
          <div className="text-3xl font-black text-[#06B6D4]">{stateCount}</div>
        </div>
      </div>

      {/* Database Listing Panel */}
      <div className="gov-card rounded-2xl overflow-hidden border-[#242832]">
        <div className="p-4 border-b border-[#242832] flex items-center justify-between bg-[#0D0F14]">
          <h2 className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-[#A855F7]" />
            Schemes Registry Table
          </h2>
          <span className="text-[10px] bg-[#101217] text-[#A1A1AA] px-2.5 py-1 rounded-lg border border-[#242832] font-bold">
            {schemes.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#A1A1AA]">
            <thead className="text-[10px] uppercase bg-[#0D0F14] text-[#71717A] font-extrabold border-b border-[#242832]">
              <tr>
                <th className="px-5 py-3">Scheme Name</th>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242832]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#71717A]">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#A855F7]" />
                      Loading database records...
                    </div>
                  </td>
                </tr>
              ) : schemes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#71717A]">
                    No scheme records found.
                  </td>
                </tr>
              ) : (
                schemes.map((scheme) => (
                  <tr key={scheme.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-[#F5F5F7]">{scheme.name}</div>
                      {scheme.ministry && (
                        <div className="text-[10px] text-[#71717A]">{scheme.ministry}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 capitalize font-semibold text-[#A1A1AA]">
                      {scheme.level || 'Central'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#101217] border border-[#242832] font-semibold text-[#A855F7]">
                        {scheme.category_icon} {scheme.category_name || 'General'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => toggleSchemeStatus(scheme.id, scheme.is_active)}
                        disabled={actionLoading[scheme.id]}
                        className="inline-flex cursor-pointer text-[#A1A1AA] hover:text-white disabled:opacity-50"
                      >
                        {actionLoading[scheme.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[#A855F7]" />
                        ) : scheme.is_active ? (
                          <span className="text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/20">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#71717A] bg-[#101217] px-2 py-0.5 rounded border border-[#242832]">
                            Disabled
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Link
                        href={`/schemes/${scheme.slug}`}
                        className="p-1.5 rounded-lg bg-[#101217] border border-[#242832] text-[#A855F7] hover:bg-[#141720] inline-flex items-center"
                        title="View detail"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => deleteScheme(scheme.id, scheme.name)}
                        disabled={actionLoading[`del_${scheme.id}`]}
                        className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 inline-flex items-center disabled:opacity-50 cursor-pointer"
                        title="Delete scheme permanently"
                      >
                        {actionLoading[`del_${scheme.id}`]
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
