'use client';

import React, { useState } from 'react';
import { Bell, Sparkles, Code2, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';

export function Header() {
  const [copied, setCopied] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const webhookUrl = 'http://localhost:3000/api/webhooks/github';

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-semibold text-slate-300">GitHub Webhook Listener Active</span>
        <span className="text-slate-600 text-xs">|</span>
        <span className="text-xs text-slate-400 font-mono">http://localhost:3000/api/webhooks/github</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={copyWebhookUrl}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          {copied ? 'Webhook URL Copied' : 'Copy Webhook URL'}
        </button>

        <button
          onClick={() => setShowSetupModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/20 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Setup Guide
        </button>
      </div>

      {/* Setup Guide Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" /> GitHub Webhook Setup Guide
              </h3>
              <button
                onClick={() => setShowSetupModal(false)}
                className="text-slate-400 hover:text-white text-lg font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-2">
                <p className="font-semibold text-xs text-indigo-300 uppercase tracking-wider">Step 1: Payload URL</p>
                <code className="block bg-slate-950 p-2 rounded text-xs font-mono text-emerald-400 break-all">
                  {webhookUrl}
                </code>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-xs text-indigo-300 uppercase tracking-wider">Step 2: Configuration</p>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  <li>Content type: <span className="font-mono text-amber-300">application/json</span></li>
                  <li>Secret: Set your <span className="font-mono text-amber-300">GITHUB_WEBHOOK_SECRET</span></li>
                  <li>Which events would you like to trigger this webhook?: Select <strong>Pull requests</strong></li>
                </ul>
              </div>

              <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 leading-relaxed">
                🚀 Incoming webhooks are parsed, verified via HMAC sha256 signature, and enqueued into <strong>BullMQ + Redis</strong> in under <strong>50 milliseconds</strong> without blocking GitHub response HTTP headers.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
