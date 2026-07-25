'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { SchemeCard, Category } from '../../types/scheme';
import { ShieldCheck, Plus, Settings, BarChart2, Eye, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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

  // Statistics
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

  // Toggle scheme active/inactive via API and persist to DB
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

      // Update local state to reflect change immediately
      setSchemes(prev => prev.map(s => s.id === id ? { ...s, is_active: newStatus } : s));
      if (newStatus) setActiveCount(c => c + 1);
      else setActiveCount(c => c - 1);
      showFeedback('success', `Scheme ${newStatus ? 'activated' : 'deactivated'} successfully.`);
    } catch (err) {
      console.error('Toggle failed:', err);
      showFeedback('error', 'Failed to update scheme status. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Permanently delete a scheme via API
  const deleteScheme = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This cannot be undone.`)) return;
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
      showFeedback('error', 'Failed to delete scheme. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`del_${id}`]: false }));
    }
  };

  return (
    <div className="mx-auto max-w-6xl w-full py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E7EB] pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-[#111827] flex items-center gap-2">
            <Settings className="h-7 w-7 text-[#0F766E]" />
            GovSchemeAI Admin Panel
          </h1>
          <p className="text-xs text-[#6B7280]">
            System administration, health monitoring, and scheme management.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/updates"
            className="flex items-center gap-2 px-4 py-2 bg-[#0F766E] hover:bg-[#0D5F59] text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer transition-all"
          >
            <Settings className="h-4 w-4" />
            Manage Updates
          </Link>
          <Link
            href="/schemes"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-lg text-xs font-semibold shadow-sm cursor-pointer transition-all"
          >
            <Plus className="h-4 w-4" />
            Browse All Schemes
          </Link>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border text-sm font-medium animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] border-[#16A34A]/20 text-[#166534]'
              : 'bg-[#FEF2F2] border-[#DC2626]/20 text-[#991B1B]'
          }`}
        >
          {feedback.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />
          }
          {feedback.message}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-xl space-y-2 relative overflow-hidden border-t-4 border-t-[#2563EB]">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[#6B7280]">Total Schemes</div>
          <div className="text-3xl font-bold text-[#2563EB]">{total}</div>
        </div>

        <div className="glass-panel p-6 rounded-xl space-y-2 relative overflow-hidden border-t-4 border-t-[#16A34A]">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[#6B7280]">Active Matching</div>
          <div className="text-3xl font-bold text-[#16A34A]">{activeCount}</div>
        </div>

        <div className="glass-panel p-6 rounded-xl space-y-2 relative overflow-hidden border-t-4 border-t-[#F59E0B]">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[#6B7280]">Central Level</div>
          <div className="text-3xl font-bold text-[#B45309]">{centralCount}</div>
        </div>

        <div className="glass-panel p-6 rounded-xl space-y-2 relative overflow-hidden border-t-4 border-t-[#8B5CF6]">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[#6B7280]">State / Local</div>
          <div className="text-3xl font-bold text-[#7C3AED]">{stateCount}</div>
        </div>
      </div>

      {/* Categories Row */}
      {categories.length > 0 && (
        <div className="glass-panel rounded-xl p-5">
          <h2 className="text-sm font-bold text-[#111827] mb-3">Categories ({categories.length})</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <span
                key={cat.slug}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[#374151] font-medium"
              >
                {cat.icon} {cat.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Database Listing Panel */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-[#0F766E]" />
            Schemes Registry
          </h2>
          <span className="text-[10px] bg-[#F3F4F6] text-[#6B7280] px-2 py-0.5 rounded font-semibold border border-[#E5E7EB]">
            Showing {schemes.length} of {total} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#374151]">
            <thead className="text-xs uppercase bg-[#F9FAFB] text-[#6B7280] font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-3.5">Scheme Details</th>
                <th className="px-6 py-3.5">Level</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-[#9CA3AF]">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading database records...
                    </div>
                  </td>
                </tr>
              ) : schemes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-[#9CA3AF]">
                    No schemes registered.
                  </td>
                </tr>
              ) : (
                schemes.map((scheme) => (
                  <tr key={scheme.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#111827]">{scheme.name}</div>
                      {scheme.ministry && (
                        <div className="text-xs text-[#9CA3AF]">{scheme.ministry}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium capitalize">
                      {scheme.level || 'Central'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-0.5 rounded bg-[#F3F4F6] border border-[#E5E7EB] font-medium text-[#374151]">
                        {scheme.category_icon} {scheme.category_name || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleSchemeStatus(scheme.id, scheme.is_active)}
                        disabled={actionLoading[scheme.id]}
                        className="inline-flex cursor-pointer text-[#6B7280] hover:text-[#111827] disabled:opacity-50"
                        title={scheme.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {actionLoading[scheme.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[#9CA3AF]" />
                        ) : scheme.is_active ? (
                          <span className="flex items-center gap-1 text-xs text-[#16A34A] font-semibold bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#16A34A]/15 hover:bg-[#DCFCE7] transition-colors">
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-[#9CA3AF] font-semibold bg-[#F3F4F6] px-2 py-0.5 rounded border border-[#E5E7EB] hover:bg-[#E5E7EB] transition-colors">
                            Disabled
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        href={`/schemes/${scheme.slug}`}
                        className="p-1.5 rounded bg-[#EFF6FF] border border-[#2563EB]/10 text-[#2563EB] hover:bg-[#DBEAFE] transition-all cursor-pointer inline-flex items-center"
                        title="View scheme detail"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => deleteScheme(scheme.id, scheme.name)}
                        disabled={actionLoading[`del_${scheme.id}`]}
                        className="p-1.5 rounded bg-[#FEF2F2] border border-[#DC2626]/10 text-[#DC2626] hover:bg-[#FEE2E2] transition-all cursor-pointer inline-flex items-center disabled:opacity-50"
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
