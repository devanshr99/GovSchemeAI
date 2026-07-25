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
      alert('Update pipeline successfully triggered in the background. Refreshing in a few seconds...');
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
    <div className="mx-auto max-w-6xl w-full py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E7EB] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#0F766E] font-semibold uppercase tracking-wider">
            <Link href="/admin" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold text-[#111827] flex items-center gap-2">
            <Settings className="h-7 w-7 text-[#0F766E]" />
            Automatic Scheme Updates
          </h1>
          <p className="text-xs text-[#6B7280]">
            Control the background web scraping scheduler, view staging areas, and approve/reject entries.
          </p>
        </div>

        <button
          onClick={triggerUpdate}
          disabled={triggerLoading || loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F766E] hover:bg-[#0D5F59] disabled:bg-[#E5E7EB] text-white disabled:text-[#9CA3AF] rounded-lg text-xs font-semibold shadow-sm cursor-pointer transition-all disabled:cursor-not-allowed"
        >
          {triggerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Trigger Scrapers Now
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0F766E]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Columns: Staging & History */}
          <div className="lg:col-span-2 space-y-8">
            {/* Staging Registry */}
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
                <h2 className="text-base font-bold text-[#111827]">
                  Staging Registry ({staged.length} pending review)
                </h2>
                <button onClick={loadData} className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer">
                  <RefreshCcw className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#374151]">
                  <thead className="text-xs uppercase bg-[#F9FAFB] text-[#6B7280] font-semibold border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-6 py-3">Scheme</th>
                      <th className="px-6 py-3">Match</th>
                      <th className="px-6 py-3">Conf</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {staged.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-[#9CA3AF]">
                          All clean! No schemes currently pending review in staging.
                        </td>
                      </tr>
                    ) : (
                      staged.map((entry) => (
                        <tr key={entry.id} className="hover:bg-[#F9FAFB]">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-[#111827]">{entry.normalized_name}</div>
                            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">
                              Source: {entry.source_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 capitalize text-xs">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              entry.match_type === 'new' ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A]/15' : 'bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/10'
                            }`}>
                              {entry.match_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium">
                            {(entry.confidence_score * 100).toFixed(0)}%
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openDetail(entry.id)}
                              className="p-1.5 rounded bg-[#FFFBEB] border border-[#F59E0B]/15 text-[#B45309] hover:bg-[#FEF3C7] transition-all cursor-pointer inline-flex items-center"
                              title="Review details"
                            >
                              <Eye className="h-4 w-4" />
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
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="p-5 border-b border-[#E5E7EB]">
                <h2 className="text-base font-bold text-[#111827]">Scrape Run History (Last 10)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#374151]">
                  <thead className="text-xs uppercase bg-[#F9FAFB] text-[#6B7280] font-semibold border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-6 py-3">Run Date</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-right">New / Upd</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {runs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-[#9CA3AF]">
                          No pipeline runs logged yet.
                        </td>
                      </tr>
                    ) : (
                      runs.slice(0, 10).map((run) => (
                        <tr key={run.id} className="hover:bg-[#F9FAFB]">
                          <td className="px-6 py-4 text-xs">
                            {new Date(run.started_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 capitalize text-xs">
                            {run.run_type}
                          </td>
                          <td className="px-6 py-4 text-center text-xs">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              run.status === 'completed' ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A]/15' :
                              run.status === 'failed' ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/15' : 'bg-[#FFFBEB] text-[#B45309] border border-[#F59E0B]/15'
                            }`}>
                              {run.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-medium">
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

          {/* Right Column: Scheduler Health & Settings */}
          <div className="space-y-8">
            <div className="glass-panel p-6 rounded-xl space-y-4">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#0F766E]" />
                Scheduler Details
              </h2>
              {health && (
                <div className="space-y-4 text-sm text-[#374151]">
                  <div className="flex justify-between border-b border-[#E5E7EB] pb-2">
                    <span className="text-[#6B7280]">Scheduler Enabled:</span>
                    <span className={`font-semibold ${health.enabled ? 'text-[#16A34A]' : 'text-[#9CA3AF]'}`}>
                      {health.enabled ? 'TRUE' : 'FALSE'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#E5E7EB] pb-2">
                    <span className="text-[#6B7280]">Status:</span>
                    <span className={`font-semibold ${health.running ? 'text-[#16A34A]' : 'text-[#9CA3AF]'}`}>
                      {health.running ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#E5E7EB] pb-2">
                    <span className="text-[#6B7280]">Cron Schedule:</span>
                    <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-xs font-mono border border-[#E5E7EB]">{health.cron}</code>
                  </div>
                  {health.next_run && (
                    <div className="space-y-1">
                      <span className="text-[#6B7280] text-xs">Next Execution Time:</span>
                      <div className="bg-[#F9FAFB] p-2 rounded text-xs border border-[#E5E7EB]">
                        {new Date(health.next_run).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="glass-panel p-6 rounded-xl space-y-4 text-[#6B7280] text-xs">
              <h3 className="font-bold text-[#111827] flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-[#F59E0B]" /> Staging Sandbox Safety
              </h3>
              <p>
                All web scraped data first lands safely in the staging zone to keep live matching completely stable.
              </p>
              <p>
                You can review, modify fields, and either approve entries to propagate them immediately or discard them if irrelevant.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal Dialog */}
      {detailEntry && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white max-w-3xl w-full rounded-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[85vh] animate-fade-in shadow-xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#111827]">Review Candidate: {detailEntry.normalized_name}</h3>
                <span className="text-xs text-[#6B7280]">Source: {detailEntry.source_name}</span>
              </div>
              <button onClick={() => setDetailEntry(null)} className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#374151] flex-1">
              {detailEntry.match_type === 'update' && detailEntry.existing_scheme && (
                <div className="bg-[#FFFBEB] border border-[#F59E0B]/15 rounded-xl p-4 space-y-2 text-[#B45309]">
                  <h4 className="font-bold text-xs uppercase tracking-wide">Fuzzy Match Detected with Existing Scheme:</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>Name:</strong> {detailEntry.existing_scheme.name}</p>
                    <p><strong>Existing Description:</strong> {detailEntry.existing_scheme.description}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-bold text-[#111827]">Normalized Attributes (Staging Preview)</h4>
                <div className="grid grid-cols-2 gap-4 bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]">
                  <div>
                    <span className="text-[#6B7280] text-xs">Scheme Name</span>
                    <p className="font-semibold text-[#111827]">{detailEntry.normalized_data.name}</p>
                  </div>
                  <div>
                    <span className="text-[#6B7280] text-xs">Level</span>
                    <p className="font-semibold capitalize text-[#111827]">{detailEntry.normalized_data.level}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#6B7280] text-xs">Description</span>
                    <p className="text-xs text-[#374151] mt-0.5">{detailEntry.normalized_data.description}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#6B7280] text-xs">Benefits</span>
                    <p className="text-xs text-[#374151] mt-0.5">{detailEntry.normalized_data.benefits || 'No benefit info'}</p>
                  </div>
                  <div>
                    <span className="text-[#6B7280] text-xs">Required Documents</span>
                    <p className="text-xs text-[#374151] mt-0.5">
                      {detailEntry.normalized_data.required_documents?.join(', ') || 'None'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#6B7280] text-xs">Official Website</span>
                    <p className="text-xs text-[#374151] mt-0.5 break-all">{detailEntry.normalized_data.official_website || 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Review Notes field */}
              <div className="space-y-2">
                <label className="block text-[#111827] font-bold">Review Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide approval reasoning or rejection reasons here..."
                  className="w-full h-20 px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#E5E7EB] flex items-center justify-end gap-3 bg-[#F9FAFB]">
              <button
                onClick={() => handleReject(detailEntry.id)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer"
              >
                <X className="h-4 w-4" /> Reject Update
              </button>
              <button
                onClick={() => handleApprove(detailEntry.id)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer"
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
