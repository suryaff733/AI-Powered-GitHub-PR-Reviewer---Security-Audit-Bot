'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldAlert, ShieldCheck, AlertTriangle, FileCode, CheckCircle2, ChevronRight, Filter, AlertOctagon } from 'lucide-react';
import { SkeletonRow } from '@/components/SkeletonLoader';

export default function AuditsPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedAudit, setSelectedAudit] = useState<any>(null);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audits');
      const json = await res.json();
      setAudits(json.audits || []);
      if (json.audits?.length > 0) {
        setSelectedAudit(json.audits[0]);
      }
    } catch (e) {
      console.error('Failed to load audits:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-400" /> Audit Explorer & Security Inspector
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Browse AI audit runs, inspect line-by-line security vulnerabilities, and review recommended patches.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                severityFilter === sev
                  ? 'bg-indigo-600 text-white shadow-sm scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Layout: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Audit Runs */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider">Recent Audit Runs</h3>

          {loading ? (
            <div className="space-y-3">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : audits.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">No audit runs logged yet.</div>
          ) : (
            <div className="space-y-3">
              {audits.map(audit => {
                const isSelected = selectedAudit?.id === audit.id;
                const pr = audit.pullRequest;
                const repo = audit.repository;

                return (
                  <button
                    key={audit.id}
                    onClick={() => setSelectedAudit(audit)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500/50 shadow-md shadow-indigo-500/10 scale-[1.01]'
                        : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-indigo-400 font-semibold">
                        PR #{pr?.prNumber || 42}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {audit.status}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-white line-clamp-1 mt-1">
                      {pr?.title || 'Pull request audit'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
                      <span>{repo?.name || 'repo'}</span>
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        {audit.totalFindings > 0 ? (
                          <span className="text-rose-400 font-bold">{audit.totalFindings} findings</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Clean</span>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Security Findings Inspector */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          {selectedAudit ? (
            <>
              {/* Selected Audit Meta */}
              <div className="border-b border-slate-800 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      PR #{selectedAudit.pullRequest?.prNumber || 42}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">SHA: {selectedAudit.commitSha}</span>
                  </div>
                  <span className="text-xs text-slate-400">Duration: {selectedAudit.durationMs}ms</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {selectedAudit.pullRequest?.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Author: <span className="text-slate-200">{selectedAudit.pullRequest?.author}</span> | Repository: <span className="text-slate-200">{selectedAudit.repository?.fullName || 'acme-corp/secure-payment-gateway'}</span>
                </p>
              </div>

              {/* Findings List */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Detected Code Vulnerabilities ({selectedAudit.findings?.length || 0})</span>
                </h4>

                {(!selectedAudit.findings || selectedAudit.findings.length === 0) ? (
                  <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-semibold text-sm text-white">No Vulnerabilities Found!</p>
                    <p className="text-xs">The AI audit engine scanned this pull request diff and found zero security flaws.</p>
                  </div>
                ) : (
                  selectedAudit.findings
                    .filter((f: any) => severityFilter === 'ALL' || f.severity === severityFilter)
                    .map((finding: any) => (
                      <motion.div
                        key={finding.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg hover:border-slate-700 transition"
                      >
                        {/* Title & Badge */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-indigo-400 font-semibold flex items-center gap-1">
                                <FileCode className="w-3.5 h-3.5" /> {finding.filePath}:{finding.lineNumber}
                              </span>
                              <span className="text-slate-600 text-xs">|</span>
                              <span className="text-xs font-semibold text-slate-300">{finding.category}</span>
                            </div>
                            <h5 className="font-bold text-base text-white">{finding.title}</h5>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase border ${
                              finding.severity === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20'
                                : finding.severity === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            }`}
                          >
                            {finding.severity}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                          {finding.description}
                        </p>

                        {/* Vulnerable Code Snippet */}
                        {finding.codeSnippet && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Vulnerable Code Snippet</span>
                            <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-rose-200 border border-rose-900/40 overflow-x-auto">
                              <code>{finding.codeSnippet}</code>
                            </pre>
                          </div>
                        )}

                        {/* Suggested Fix */}
                        {finding.suggestedFix && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Suggested AI Code Patch</span>
                            <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-emerald-300 border border-emerald-900/40 overflow-x-auto">
                              <code>{finding.suggestedFix}</code>
                            </pre>
                          </div>
                        )}
                      </motion.div>
                    ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-500 text-sm">Select an audit run from the left panel to inspect findings.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
