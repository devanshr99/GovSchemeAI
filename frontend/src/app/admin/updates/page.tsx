'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { Settings, Play, ArrowLeft, Loader2, Check, X, ShieldAlert, Clock, RefreshCcw, Eye } from 'lucide-react';
import Link from 'next/link';

export default function UpdatesManagement() {
  const [health, setHealth] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [staged, setStaged] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [detailEntry, setDetailEntry] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getUpdateHealth(),
      api.getUpdateRuns(),
      api.getStagedEntries('pending')
    ])
      .then(([healthRes, runsRes, stagedRes]) => {
        setHealth(healthRes);
        setRuns(runsRes);
        setStaged(stagedRes);
      })
      .catch(err => console.error('Failed to load update control data:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const triggerUpdate = async () => {
    setTriggerLoading(true);
    try {
      await api.triggerUpdateRun();
      alert('Update pipeline successfully triggered in background.');
      setTimeout(() => loadData(), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to trigger update run.');
    } finally {
      setTriggerLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const res = await api.getStagedEntryDetail(id);
      setDetailEntry(res);
      setNotes('');
    } catch (err) {
      console.error(err);
      alert('Failed to load entry details.');
    }
  };

  const handleApprove = async (id: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.approveStagedEntry(id, notes);
      setDetailEntry(null);
      setStaged(prev => prev.filter(item => item.id !== id));
      loadData();
    } catch (err) {
      console.error(err);
      alert('Approval failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.rejectStagedEntry(id, notes);
      setDetailEntry(null);
      setStaged(prev => prev.filter(item => item.id !== id));
      loadData();
    } catch (err) {
      console.error(err);
      alert('Rejection failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl w-full py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#242832] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#A855F7] font-bold uppercase tracking-wider">
            <Link href="/admin" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-black text-[#F5F5F7] flex items-center gap-2">
            <Settings className="h-7 w-7 text-[#A855F7]" />
            Automatic Scheme Updates
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            Control background scraper scheduler, view staging queue, and approve/reject updates.
          </p>
        </div>

        <button
          onClick={triggerUpdate}
          disabled={triggerLoading || loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-[#101217] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all disabled:cursor-not-allowed"
        >
          {triggerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Trigger Scrapers Now
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#A855F7]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Staging Registry */}
            <div className="gov-card rounded-2xl overflow-hidden border-[#242832]">
              <div className="p-4 border-b border-[#242832] flex items-center justify-between bg-[#0D0F14]">
                <h2 className="text-sm font-bold text-[#F5F5F7]">
                  Staging Registry ({staged.length} pending review)
                </h2>
                <button onClick={loadData} className="text-[#A1A1AA] hover:text-white cursor-pointer">
                  <RefreshCcw className="h-4 w-4 text-[#A855F7]" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#A1A1AA]">
                  <thead className="text-[10px] uppercase bg-[#0D0F14] text-[#71717A] font-extrabold border-b border-[#242832]">
                    <tr>
                      <th className="px-5 py-3">Scheme</th>
                      <th className="px-5 py-3">Match</th>
                      <th className="px-5 py-3">Confidence</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242832]">
                    {staged.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-[#71717A]">
                          No pending entries in staging queue.
                        </td>
                      </tr>
                    ) : (
                      staged.map((entry) => (
                        <tr key={entry.id} className="hover:bg-white/[0.01]">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-[#F5F5F7]">{entry.normalized_name}</div>
                            <span className="text-[9px] text-[#71717A] uppercase">
                              Source: {entry.source_name}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 capitalize">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              entry.match_type === 'new' ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20' : 'bg-[#8B5CF6]/15 text-[#A855F7] border border-[#8B5CF6]/30'
                            }`}>
                              {entry.match_type}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-[#F5F5F7]">
                            {(entry.confidence_score * 100).toFixed(0)}%
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => openDetail(entry.id)}
                              className="p-1.5 rounded-lg bg-[#101217] border border-[#242832] text-[#A855F7] hover:bg-[#141720] transition-all cursor-pointer inline-flex items-center"
                              title="Review details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Run logs */}
            <div className="gov-card rounded-2xl overflow-hidden border-[#242832]">
              <div className="p-4 border-b border-[#242832] bg-[#0D0F14]">
                <h2 className="text-sm font-bold text-[#F5F5F7]">Scrape Run History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#A1A1AA]">
                  <thead className="text-[10px] uppercase bg-[#0D0F14] text-[#71717A] font-extrabold border-b border-[#242832]">
                    <tr>
                      <th className="px-5 py-3">Run Date</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-right">New / Upd</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242832]">
                    {runs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-[#71717A]">
                          No pipeline runs logged yet.
                        </td>
                      </tr>
                    ) : (
                      runs.slice(0, 10).map((run) => (
                        <tr key={run.id} className="hover:bg-white/[0.01]">
                          <td className="px-5 py-3.5">
                            {new Date(run.started_at).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 capitalize">
                            {run.run_type}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              run.status === 'completed' ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20' :
                              run.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {run.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-[#F5F5F7]">
                            {run.new_schemes} / {run.updated_schemes}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="gov-card p-6 rounded-2xl space-y-3 border-[#242832] bg-[#0D0F14]">
              <h2 className="text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#A855F7]" />
                Scheduler Details
              </h2>
              {health && (
                <div className="space-y-3 text-xs text-[#A1A1AA]">
                  <div className="flex justify-between border-b border-[#242832] pb-2">
                    <span>Scheduler Enabled:</span>
                    <span className={`font-bold ${health.enabled ? 'text-[#22C55E]' : 'text-[#71717A]'}`}>
                      {health.enabled ? 'TRUE' : 'FALSE'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#242832] pb-2">
                    <span>Status:</span>
                    <span className={`font-bold ${health.running ? 'text-[#22C55E]' : 'text-[#71717A]'}`}>
                      {health.running ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#242832] pb-2">
                    <span>Cron Schedule:</span>
                    <code className="bg-[#101217] px-1.5 py-0.5 rounded text-[10px] font-mono text-[#A855F7]">{health.cron}</code>
                  </div>
                </div>
              )}
            </div>

            <div className="gov-card p-6 rounded-2xl space-y-3 border-[#242832] text-xs text-[#A1A1AA]">
              <h3 className="font-bold text-[#F5F5F7] flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-[#A855F7]" /> Staging Sandbox
              </h3>
              <p>
                Scraped data is staged for review before publishing to live citizen search.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {detailEntry && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="gov-card max-w-3xl w-full rounded-3xl border border-[#242832] overflow-hidden flex flex-col max-h-[85vh] animate-fade-in bg-[#08090D]">
            <div className="p-5 border-b border-[#242832] flex items-center justify-between bg-[#0D0F14]">
              <div>
                <h3 className="text-base font-bold text-[#F5F5F7]">Review Candidate: {detailEntry.normalized_name}</h3>
                <span className="text-xs text-[#71717A]">Source: {detailEntry.source_name}</span>
              </div>
              <button onClick={() => setDetailEntry(null)} className="text-[#A1A1AA] hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#A1A1AA] flex-1">
              <div className="space-y-3 bg-[#101217] p-4 rounded-xl border border-[#242832]">
                <div>
                  <span className="text-[#71717A] block font-bold">Scheme Name</span>
                  <p className="font-bold text-[#F5F5F7]">{detailEntry.normalized_data.name}</p>
                </div>
                <div>
                  <span className="text-[#71717A] block font-bold">Description</span>
                  <p className="text-[#A1A1AA]">{detailEntry.normalized_data.description}</p>
                </div>
                <div>
                  <span className="text-[#71717A] block font-bold">Benefits</span>
                  <p className="text-[#A1A1AA]">{detailEntry.normalized_data.benefits || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[#F5F5F7] font-bold">Reviewer Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes..."
                  className="w-full h-20 px-3 py-2 bg-[#0D0F14] border border-[#242832] rounded-xl text-xs text-[#F5F5F7]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#242832] flex items-center justify-end gap-3 bg-[#0D0F14]">
              <button
                onClick={() => handleReject(detailEntry.id)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                <X className="h-4 w-4" /> Reject Update
              </button>
              <button
                onClick={() => handleApprove(detailEntry.id)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                <Check className="h-4 w-4" /> Approve & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
