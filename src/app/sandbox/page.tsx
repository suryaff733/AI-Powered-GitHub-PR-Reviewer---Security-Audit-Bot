'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, ShieldAlert, Sparkles, Code2, Check, RefreshCw, AlertCircle, FileCode, CheckCircle2, Cpu } from 'lucide-react';

const PRESETS = {
  sqli: {
    title: '🚨 SQL Injection Vulnerability',
    diff: `diff --git a/src/controllers/auth.ts b/src/controllers/auth.ts
index e69de29..4b825dc 100644
--- a/src/controllers/auth.ts
+++ b/src/controllers/auth.ts
@@ -10,6 +10,12 @@ export async function loginUser(req: Request, res: Response) {
-  const query = "SELECT * FROM users WHERE email = ?";
+  // Vulnerable user lookup concatenation
+  const query = "SELECT * FROM users WHERE email = '" + req.body.email + "' AND password = '" + req.body.password + "'";
+  const user = await db.query(query);
+  return res.json({ success: true, user });
 }`,
  },
  secret: {
    title: '🔑 Hardcoded Secret API Key',
    diff: `diff --git a/src/utils/stripe.ts b/src/utils/stripe.ts
index a1b2c3d..e5f6g7h 100644
--- a/src/utils/stripe.ts
+++ b/src/utils/stripe.ts
@@ -15,4 +15,6 @@ export function getStripeClient() {
+  // Hardcoded Stripe Secret Key exposed in git commit
+  const stripeKey = 'sk_test_demo_sample_stripe_secret_key_99';
+  return new Stripe(stripeKey);
 }`,
  },
  perf: {
    title: '⚡ O(N^2) Quadratic Performance Loop',
    diff: `diff --git a/src/services/report.ts b/src/services/report.ts
index c3d2e1a..b4a5c6d 100644
--- a/src/services/report.ts
+++ b/src/services/report.ts
@@ -40,6 +40,8 @@ export function matchOrdersToUsers(orders: Order[], users: User[]) {
+  orders.forEach(order => {
+    const user = users.find(u => u.id === order.userId);
+    order.user = user;
+  });
 }`,
  },
  clean: {
    title: '🛡️ Clean Secure Code',
    diff: `diff --git a/src/services/auth.ts b/src/services/auth.ts
index f1e2d3c..a4b5c6d 100644
--- a/src/services/auth.ts
+++ b/src/services/auth.ts
@@ -20,6 +20,9 @@ export async function secureLogin(email: string, pass: string) {
+  const user = await prisma.user.findUnique({
+    where: { email },
+  });
+  return user;
 }`,
  },
};

export default function SandboxPage() {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESETS>('sqli');
  const [diffInput, setDiffInput] = useState(PRESETS.sqli.diff);
  const [prTitle, setPrTitle] = useState('feat: add user authentication and payment flow');
  const [loading, setLoading] = useState(false);
  const [auditStep, setAuditStep] = useState(0); // 0: Idle, 1: Enqueuing, 2: LLM Auditing, 3: Completed
  const [auditResponse, setAuditResponse] = useState<any>(null);

  const handlePresetSelect = (key: keyof typeof PRESETS) => {
    setSelectedPreset(key);
    setDiffInput(PRESETS[key].diff);
    setAuditResponse(null);
  };

  const runSimulation = async () => {
    setLoading(true);
    setAuditResponse(null);
    setAuditStep(1);

    // Smooth step progress simulator
    const stepTimer = setInterval(() => {
      setAuditStep(prev => (prev < 2 ? prev + 1 : prev));
    }, 600);

    try {
      const res = await fetch('/api/audit/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawDiff: diffInput,
          prTitle,
          owner: 'acme-corp',
          repo: 'secure-payment-gateway',
        }),
      });

      const json = await res.json();
      setAuditResponse(json);
      setAuditStep(3);
    } catch (e: any) {
      alert(`Simulation failed: ${e.message}`);
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <PlayCircle className="w-6 h-6 text-indigo-400" /> Interactive PR Audit Simulator
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Test the LLM Security Audit Engine on custom git diffs with smooth step-by-step progress tracking.
        </p>
      </div>

      {/* Preset Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vulnerability Presets:</span>
        {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map(key => (
          <button
            key={key}
            onClick={() => handlePresetSelect(key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              selectedPreset === key
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-md shadow-indigo-500/10 scale-[1.02]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {PRESETS[key].title}
          </button>
        ))}
      </div>

      {/* Main Grid: Code Editor & Live Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Git Diff Editor */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-400" /> Raw Unified Git Diff Input
              </label>
              <span className="text-[11px] text-slate-400 font-mono">patch format</span>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={prTitle}
                onChange={e => setPrTitle(e.target.value)}
                placeholder="Pull Request Title"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 transition"
              />

              <textarea
                value={diffInput}
                onChange={e => setDiffInput(e.target.value)}
                rows={16}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500 leading-relaxed transition"
                placeholder="Paste unified git diff patch here..."
              />
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" /> Running AI Audit Pipeline...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" /> Run AI Security & Code Audit
              </>
            )}
          </button>
        </div>

        {/* Right Col: Live Generated Results */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-3">
            <span>Live Audit Output</span>
            {auditResponse && (
              <span className="text-xs font-mono text-indigo-400 font-medium">
                {auditResponse.auditResult?.durationMs}ms | {auditResponse.auditResult?.tokensUsed} Tokens
              </span>
            )}
          </h3>

          {/* Smooth Step-by-Step Loader */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 px-6 bg-slate-950/80 rounded-2xl border border-indigo-500/30 text-center space-y-6"
            >
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-30"></span>
                <div className="p-4 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-500/40">
                  <Cpu className="w-7 h-7 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-base text-white">AI Security Pipeline Active</h4>
                <p className="text-xs text-slate-400">Offloading job to BullMQ background queue & Gemini Auditor</p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-2 max-w-sm mx-auto text-left text-xs">
                <div className={`flex items-center gap-2.5 p-2 rounded-lg transition ${auditStep >= 1 ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4" /> <span>1. Webhook verified & enqueued to BullMQ Redis (&lt;50ms)</span>
                </div>
                <div className={`flex items-center gap-2.5 p-2 rounded-lg transition ${auditStep >= 2 ? 'text-indigo-300 bg-indigo-500/10 font-semibold' : 'text-slate-500'}`}>
                  <RefreshCw className={`w-4 h-4 ${auditStep === 2 ? 'animate-spin text-amber-300' : ''}`} /> <span>2. Gemini LLM analyzing OWASP flaws & diff lines</span>
                </div>
                <div className={`flex items-center gap-2.5 p-2 rounded-lg transition ${auditStep >= 3 ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4" /> <span>3. Generating inline review comments & code fixes</span>
                </div>
              </div>
            </motion.div>
          )}

          {!auditResponse && !loading && (
            <div className="text-center py-20 text-slate-500 text-sm space-y-2">
              <PlayCircle className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="font-medium text-white text-sm">No Audit Run Triggered Yet</p>
              <p className="text-xs text-slate-400">Click &quot;Run AI Security & Code Audit&quot; above to simulate an incoming PR webhook.</p>
            </div>
          )}

          <AnimatePresence>
            {auditResponse?.auditResult && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Summary Card */}
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    auditResponse.auditResult.decision === 'REQUEST_CHANGES'
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-200 shadow-lg shadow-rose-950/30'
                      : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 shadow-lg shadow-emerald-950/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider">
                      PR Review Decision: {auditResponse.auditResult.decision}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/40">
                      {auditResponse.auditResult.findings?.length || 0} Issue(s)
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">{auditResponse.auditResult.summary}</p>
                </div>

                {/* Inline Comments Cards */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inline PR Comments Preview:</h4>
                  {auditResponse.auditResult.findings?.map((f: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-indigo-400 flex items-center gap-1 font-semibold">
                          <FileCode className="w-3.5 h-3.5" /> {f.filePath}:{f.lineNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            f.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300'
                              : f.severity === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {f.severity}
                        </span>
                      </div>

                      <p className="font-bold text-xs text-white">{f.title}</p>
                      <p className="text-xs text-slate-300">{f.description}</p>

                      {f.suggestedFix && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-emerald-400 uppercase">Inline GitHub Code Suggestion:</span>
                          <pre className="bg-slate-950 p-2.5 rounded text-xs font-mono text-emerald-300 border border-emerald-900/30 overflow-x-auto">
                            <code>{f.suggestedFix}</code>
                          </pre>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
