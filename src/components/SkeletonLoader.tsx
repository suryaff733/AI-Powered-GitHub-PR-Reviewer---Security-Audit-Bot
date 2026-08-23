import React from 'react';

export function SkeletonCard() {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-28 bg-slate-800 rounded"></div>
        <div className="h-7 w-7 bg-slate-800 rounded-lg"></div>
      </div>
      <div className="h-8 w-20 bg-slate-800 rounded"></div>
      <div className="h-2 w-36 bg-slate-800/60 rounded"></div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-slate-800 rounded"></div>
        <div className="h-4 w-16 bg-slate-800 rounded"></div>
      </div>
      <div className="h-3 w-3/4 bg-slate-800/80 rounded"></div>
      <div className="h-3 w-1/2 bg-slate-800/60 rounded"></div>
    </div>
  );
}
