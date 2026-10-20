'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { Play, ArrowLeft, Loader2, Check, X, ShieldAlert, Clock, RefreshCcw, Eye, Database, Activity } from 'lucide-react';
import Link from 'next/link';

interface SchedulerHealth {
  enabled: boolean;
  running: boolean;
  cron: string;
}

interface UpdateRun {
  id: string;
  started_at: string;
  run_type: string;
  status: string;
  new_schemes: number;
  updated_schemes: number;
}

interface StagedEntry {
  id: string;
  normalized_name: string;
  source_name: string;
  match_type: string;
  confidence_score: number;
  normalized_data: {
    name?: string;
    description?: string;
    benefits?: string;
  };
}

export default function UpdatesManagement() {
  const [health, setHealth] = useState<SchedulerHealth | null>(null);
  const [runs, setRuns] = useState<UpdateRun[]>([]);
  const [staged, setStaged] = useState<StagedEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [triggerLoading, setTriggerLoading] = useState<boolean>(false);
  const [detailEntry, setDetailEntry] = useState<StagedEntry | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getUpdateHealth(),
      api.getUpdateRuns(),
      api.getStagedEntries('pending')
    ])
      .then(([healthRes, runsRes, stagedRes]) => {
        setHealth(healthRes);
        setRuns(runsRes as unknown as UpdateRun[]);
        setStaged(stagedRes as unknown as StagedEntry[]);
      })
      .catch(err => console.error('Failed to load update control data:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([
      api.getUpdateHealth(),
      api.getUpdateRuns(),
      api.getStagedEntries('pending')
    ])
      .then(([healthRes, runsRes, stagedRes]) => {
        if (!isCurrent) return;
        setHealth(healthRes);
        setRuns(runsRes as unknown as UpdateRun[]);
        setStaged(stagedRes as unknown as StagedEntry[]);
      })
      .catch(err => {
        if (!isCurrent) return;
        console.error('Failed to load update control data:', err);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

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
      setDetailEntry(res as unknown as StagedEntry);
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
    <div className="mx-auto max-w-7xl w-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-purple-400 font-bold uppercase tracking-wider">
            <Link href="/admin" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Registry Admin
            </Link>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-100 flex items-center gap-2.5">
            <Database className="h-7 w-7 text-purple-400" />
            <span>Automatic Scheme Updates Pipeline</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Control background scraper scheduler, inspect crawler staging records, and approve live scheme updates.
          </p>
        </div>

        <button
          type="button"
          onClick={triggerUpdate}
          disabled={triggerLoading || loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer transition-all disabled:cursor-not-allowed"
        >
          {triggerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          <span>Trigger Crawler Run Now</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <span className="text-xs text-slate-400">Loading staging records and scraper status...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Columns: Staging Registry & Run History */}
          <div className="lg:col-span-2 space-y-8">
            {/* Staging Registry */}
            <div className="gov-card rounded-2xl overflow-hidden border border-white/[0.08]">
              <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#0E1017]">
                <h2 className="font-heading text-sm font-bold text-slate-100">
                  Staging Registry ({staged.length} pending review)
                </h2>
                <button
                  type="button"
                  onClick={loadData}
                  className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg transition-colors"
                  title="Refresh staging data"
                >
                  <RefreshCcw className="h-4 w-4 text-purple-400" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-[10px] uppercase bg-[#0E1017] text-slate-400 font-extrabold border-b border-white/[0.08]">
                    <tr>
                      <th className="px-5 py-3">Scheme Name</th>
                      <th className="px-5 py-3">Match Type</th>
                      <th className="px-5 py-3">Confidence</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {staged.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-slate-400">
                          No pending entries in staging queue. All updates applied.
                        </td>
                      </tr>
                    ) : (
                      staged.map((entry) => (
                        <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-heading font-bold text-slate-100 text-xs sm:text-sm">{entry.normalized_name}</div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                              Source: {entry.source_name}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 capitalize">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              entry.match_type === 'new' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                            }`}>
                              {entry.match_type}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-200">
                            {(entry.confidence_score * 100).toFixed(0)}%
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => openDetail(entry.id)}
                              className="p-1.5 rounded-lg bg-[#0E1017] border border-white/[0.08] text-purple-400 hover:text-white hover:border-purple-500/40 transition-all cursor-pointer inline-flex items-center"
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
            <div className="gov-card rounded-2xl overflow-hidden border border-white/[0.08]">
              <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#0E1017]">
                <h2 className="font-heading text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>Scraper Execution History</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-[10px] uppercase bg-[#0E1017] text-slate-400 font-extrabold border-b border-white/[0.08]">
                    <tr>
                      <th className="px-5 py-3">Run Date</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-right">New / Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {runs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-slate-400">
                          No pipeline execution logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      runs.slice(0, 10).map((run) => (
                        <tr key={run.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5 text-slate-300">
                            {new Date(run.started_at).toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-3.5 capitalize font-medium text-slate-300">
                            {run.run_type}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              run.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {run.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-slate-100">
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

          {/* Right Column: Scheduler Details & Staging sandbox */}
          <div className="space-y-6">
            <div className="gov-card p-6 rounded-2xl space-y-4 border border-white/[0.08] bg-[#0E1017]">
              <h2 className="font-heading text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-white/[0.06] pb-3">
                <Clock className="h-4 w-4 text-purple-400" />
                <span>Scheduler Health & Cron</span>
              </h2>
              {health && (
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                    <span className="text-slate-400">Scheduler Engine:</span>
                    <span className={`font-bold text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider ${
                      health.enabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#0E1017] text-slate-400 border-white/[0.08]'
                    }`}>
                      {health.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                    <span className="text-slate-400">Execution Status:</span>
                    <span className={`font-bold text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider ${
                      health.running ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#0E1017] text-slate-400 border-white/[0.08]'
                    }`}>
                      {health.running ? 'Running' : 'Idle'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Cron Schedule:</span>
                    <code className="bg-[#12141D] px-2 py-1 rounded text-[11px] font-mono text-purple-300 border border-white/[0.08]">{health.cron}</code>
                  </div>
                </div>
              )}
            </div>

            <div className="gov-card p-6 rounded-2xl space-y-3 border border-white/[0.08] text-xs text-slate-400 bg-[#0E1017]">
              <h3 className="font-heading font-bold text-slate-200 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-purple-400" />
                <span>Staging Review Sandbox</span>
              </h3>
              <p className="leading-relaxed">
                Aggregated government scheme updates are sanitized and held in this staging queue. Inspect criteria differences before committing changes to the citizen-facing registry.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Review Candidate Modal */}
      {detailEntry && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="gov-card max-w-3xl w-full rounded-3xl border border-white/[0.1] overflow-hidden flex flex-col max-h-[85vh] bg-[#0E1017] shadow-2xl">
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#11131C]">
              <div>
                <h3 className="font-heading text-base font-bold text-slate-100">Review Candidate: {detailEntry.normalized_name}</h3>
                <span className="text-xs text-slate-400">Source: {detailEntry.source_name}</span>
              </div>
              <button 
                type="button"
                onClick={() => setDetailEntry(null)} 
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 flex-1">
              <div className="space-y-3 bg-[#11131C] p-4 rounded-xl border border-white/[0.08]">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Scheme Name</span>
                  <p className="font-heading font-bold text-slate-100 text-sm">{detailEntry.normalized_data.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Description</span>
                  <p className="text-slate-300 leading-relaxed">{detailEntry.normalized_data.description}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Benefits</span>
                  <p className="text-emerald-400 font-semibold">{detailEntry.normalized_data.benefits || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-200 font-bold">Reviewer Evaluation Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add evaluation comments before publishing..."
                  className="w-full h-20 px-3 py-2 bg-[#11131C] border border-white/[0.08] rounded-xl text-xs text-slate-100 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-white/[0.08] flex items-center justify-end gap-3 bg-[#11131C]">
              <button
                type="button"
                onClick={() => handleReject(detailEntry.id)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" /> Reject Update
              </button>
              <button
                type="button"
                onClick={() => handleApprove(detailEntry.id)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-purple-600/20 transition-colors"
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
