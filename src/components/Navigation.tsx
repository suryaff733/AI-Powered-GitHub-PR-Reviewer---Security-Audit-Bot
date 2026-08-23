'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, LayoutDashboard, Search, PlayCircle, BarChart3, GitPullRequest, Cpu } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/audits', label: 'Audit Explorer', icon: Search },
    { href: '/sandbox', label: 'PR Simulator', icon: PlayCircle },
    { href: '/analytics', label: 'Analytics & Quota', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 z-40 p-4">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/80">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/30 animate-pulse-slow">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              GitGuard AI
            </h1>
            <p className="text-xs text-indigo-400 font-medium">PR Security Audit Bot</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Queue Engine
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              BullMQ + Redis
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <GitPullRequest className="w-3.5 h-3.5 text-indigo-400" /> Webhook API
            </span>
            <span className="text-slate-300 font-mono text-[10px]">&lt; 50ms</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
