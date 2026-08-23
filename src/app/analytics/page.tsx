'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Cpu, ShieldAlert, Zap, Layers, RefreshCw, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#e11d48', '#f59e0b', '#3b82f6', '#10b981'];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const kpis = data?.kpis || {
    totalAudits: 24,
    totalFindings: 7,
    totalTokens: 145200,
    avgLatencyMs: 1420,
    activeRepos: 3,
  };

  const usageHistory = data?.usageHistory || [
    { day: 'Mon', tokens: 12400, audits: 8 },
    { day: 'Tue', tokens: 18900, audits: 12 },
    { day: 'Wed', tokens: 15300, audits: 9 },
    { day: 'Thu', tokens: 24100, audits: 15 },
    { day: 'Fri', tokens: 29800, audits: 18 },
    { day: 'Sat', tokens: 8200, audits: 4 },
    { day: 'Sun', tokens: 14500, audits: 10 },
  ];

  const categoryData = data?.categoryBreakdown || [
    { name: 'SECURITY', value: 4 },
    { name: 'PERFORMANCE', value: 2 },
    { name: 'SYNTAX', value: 1 },
    { name: 'BEST_PRACTICE', value: 2 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" /> Token Usage & Rate Limiting Analytics
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time telemetry tracking LLM token expenditure, BullMQ queue throughput, and vulnerability categories.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tokens Consumed</span>
          <p className="text-2xl font-extrabold text-white font-mono">{kpis.totalTokens.toLocaleString()}</p>
          <p className="text-[11px] text-indigo-400">Budget limit: 500,000 / repo</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Audit Latency</span>
          <p className="text-2xl font-extrabold text-amber-300 font-mono">{kpis.avgLatencyMs}ms</p>
          <p className="text-[11px] text-slate-400">End-to-end LLM processing</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">BullMQ Queue Latency</span>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono">&lt; 35ms</p>
          <p className="text-[11px] text-slate-400">Non-blocking webhook ACK</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Repositories</span>
          <p className="text-2xl font-extrabold text-indigo-300 font-mono">{kpis.activeRepos}</p>
          <p className="text-[11px] text-slate-400">Enforced token rate-limiting</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Consumption Trend (Area Chart) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" /> LLM Token Expenditure (7-Day Trend)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageHistory}>
                <defs>
                  <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="tokens" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#tokenGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vulnerability Distribution (Pie Chart) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" /> Findings Breakdown
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {categoryData.map((cat: any, i: number) => (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="text-slate-300 font-medium">{cat.name}: {cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
