'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SchemeCard } from '../../types/scheme';
import { Plus, Settings, BarChart2, Eye, Trash2, AlertCircle, CheckCircle2, Loader2, Database, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface ActionFeedback {
  type: 'success' | 'error';
  message: string;
}

export default function AdminPanel() {
  const [schemes, setSchemes] = useState<SchemeCard[]>([]);
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

  useEffect(() => {
    let isCurrent = true;
    api.getSchemes({ page: 1, pageSize: 1000, activeOnly: false })
      .then(schemesRes => {
        if (!isCurrent) return;
        setSchemes(schemesRes.schemes);
        setTotal(schemesRes.total);
        setActiveCount(schemesRes.schemes.filter(s => s.is_active).length);
        setCentralCount(schemesRes.schemes.filter(s => s.level === 'central').length);
        setStateCount(schemesRes.schemes.filter(s => s.level === 'state').length);
      })
      .catch(err => {
        if (!isCurrent) return;
        console.error(err);
        showFeedback('error', 'Failed to load schemes. Is the backend running?');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const toggleSchemeStatus = async (id: string, currentStatus: boolean) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    const newStatus = !currentStatus;
    try {
      await api.toggleSchemeStatus(id, newStatus);
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
      await api.deleteScheme(id);

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
    <div className="mx-auto max-w-7xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Settings className="h-3.5 w-3.5" />
            <span>System Operations</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-100 flex items-center gap-2.5">
            <span>GovSchemeAI Registry Admin</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            System administration, live scheme status toggles, and metadata health monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/updates"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
          >
            <Database className="h-4 w-4" />
            <span>Staging Pipeline</span>
          </Link>
          <Link
            href="/schemes"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#111827] hover:bg-[#1a2333] border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            <Plus className="h-4 w-4 text-blue-400" />
            <span>Browse All Schemes</span>
          </Link>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-xs font-semibold animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            : <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          }
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 rounded-2xl border border-slate-800 bg-[#111827] space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Registry</div>
          <div className="font-heading text-3xl font-black text-slate-100">{total}</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-[#111827] space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Matching</div>
          <div className="font-heading text-3xl font-black text-emerald-400">{activeCount}</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-[#111827] space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Central Level</div>
          <div className="font-heading text-3xl font-black text-blue-400">{centralCount}</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-[#111827] space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">State Level</div>
          <div className="font-heading text-3xl font-black text-cyan-400">{stateCount}</div>
        </div>
      </div>

      {/* Database Listing Panel */}
      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#111827]">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#0e1726]">
          <h2 className="font-heading text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-blue-400" />
            <span>Government Schemes Registry</span>
          </h2>
          <span className="text-[10px] bg-[#0b0f19] text-slate-400 px-3 py-1 rounded-lg border border-slate-800 font-bold">
            {schemes.length} records loaded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[10px] uppercase bg-[#0b0f19] text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Scheme Name</th>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                      <span>Loading registry records from backend...</span>
                    </div>
                  </td>
                </tr>
              ) : schemes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No scheme records found in database.
                  </td>
                </tr>
              ) : (
                schemes.map((scheme) => (
                  <tr key={scheme.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-heading font-bold text-slate-100 text-xs sm:text-sm">{scheme.name}</div>
                      {scheme.ministry && (
                        <div className="text-[10px] text-slate-400">{scheme.ministry}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 capitalize font-semibold text-slate-300">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        scheme.level === 'central'
                          ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}>
                        {scheme.level || 'Central'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#0b0f19] border border-slate-800 font-semibold text-slate-300">
                        {scheme.category_icon} {scheme.category_name || 'General'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSchemeStatus(scheme.id, scheme.is_active)}
                        disabled={actionLoading[scheme.id]}
                        className="inline-flex cursor-pointer disabled:opacity-50"
                        title={scheme.is_active ? 'Click to disable' : 'Click to activate'}
                      >
                        {actionLoading[scheme.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                        ) : scheme.is_active ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-[#0b0f19] px-2.5 py-1 rounded-md border border-slate-800">
                            Disabled
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Link
                        href={`/schemes/${scheme.slug}`}
                        className="p-1.5 rounded-lg bg-[#0b0f19] border border-slate-800 text-blue-400 hover:text-white hover:border-blue-500/40 inline-flex items-center transition-colors"
                        title="View detail"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteScheme(scheme.id, scheme.name)}
                        disabled={actionLoading[`del_${scheme.id}`]}
                        className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 inline-flex items-center disabled:opacity-50 cursor-pointer transition-colors"
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
