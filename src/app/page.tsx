'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Zap, Cpu, GitPullRequest, ArrowUpRight, Play, RefreshCw, Activity } from 'lucide-react';
import { SkeletonCard } from '@/components/SkeletonLoader';

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const kpis = data?.kpis || {
    totalAudits: 24,
    totalFindings: 7,
    criticalCount: 2,
    highCount: 3,
    mediumCount: 2,
    totalTokens: 145200,
    avgLatencyMs: 1420,
    activeRepos: 3,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            AI PR Reviewer & Security Control Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Asynchronous background job queue (BullMQ + Redis) processing incoming GitHub webhook PR diffs with Gemini LLM security audits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/sandbox"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Run Live PR Simulator
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Card 1: Audits Processed */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total PR Audits</span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <GitPullRequest className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white tracking-tight">{kpis.totalAudits}</span>
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> +14% vs last week
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Automated reviews posted to GitHub</p>
            </div>

            {/* Card 2: Security Vulnerabilities */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Vulnerabilities</span>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-rose-400 tracking-tight">{kpis.totalFindings}</span>
                <div className="flex gap-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {kpis.criticalCount} Critical
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {kpis.highCount} High
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">OWASP, SQLi, secrets & performance bugs</p>
            </div>

            {/* Card 3: BullMQ Webhook Latency */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Webhook Response Latency</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-amber-300 font-mono tracking-tight">&lt; 35ms</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Non-blocking Queue
                </span>
              </div>
              <p className="text-[11px] text-slate-400">BullMQ Redis async enqueue duration</p>
            </div>

            {/* Card 4: Tokens Consumed */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">LLM Tokens Consumed</span>
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                  {kpis.totalTokens.toLocaleString()}
                </span>
                <span className="text-xs text-indigo-400 font-medium">Gemini 1.5 Flash</span>
              </div>
              <p className="text-[11px] text-slate-400">Tracked per repo rate-limiting budget</p>
            </div>
          </>
        )}
      </div>

      {/* Main Grid: Architecture & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Engineering Architecture Highlights */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Engineering Architecture Highlights
            </h3>
            <span className="text-xs font-mono text-slate-400">Next.js 14 + BullMQ + Gemini</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-indigo-500/30 transition">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-4 h-4" /> Async Queue Architecture
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Uses <strong>BullMQ + Redis</strong> to immediately acknowledge incoming GitHub webhooks in &lt;50ms, offloading heavy git diff parsing and LLM calls to background worker processes without HTTP timeouts.
              </p>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-emerald-500/30 transition">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> Security & Rate Limiting
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Verifies GitHub HMAC sha256 signatures (`x-hub-signature-256`) and enforces strict token bucket rate-limiting per repository to protect LLM budget quotas.
              </p>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-amber-500/30 transition">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <GitPullRequest className="w-4 h-4" /> Inline PR Review Comments
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Parses unified diff hunks to calculate precise line number offsets, placing inline GitHub review suggestions directly on vulnerable code additions.
              </p>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-violet-500/30 transition">
              <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
                <Cpu className="w-4 h-4" /> Multi-Pass AI Audit Engine
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Leverages Gemini LLM structured outputs to scan for OWASP Top 10 vulnerabilities, unhandled async exceptions, and O(N^2) performance bottlenecks.
              </p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-indigo-200">Want to test the AI Auditor right now?</h4>
              <p className="text-xs text-slate-400">Use our built-in PR Sandbox Simulator with pre-packaged vulnerable code samples.</p>
            </div>
            <Link
              href="/sandbox"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition hover:scale-[1.02]"
            >
              Open Simulator
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Active Monitored Repositories */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold text-base text-white">Monitored Repositories</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              3 Active
            </span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-200">acme-corp/secure-payment-gateway</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Quota: 450,000 / 500,000</span>
                <span>4 Audits today</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-200">acme-corp/auth-microservice</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Quota: 380,000 / 500,000</span>
                <span>8 Audits today</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '76%' }}></div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-200">acme-corp/frontend-portal</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Quota: 490,000 / 500,000</span>
                <span>2 Audits today</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
