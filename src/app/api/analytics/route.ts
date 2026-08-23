import { NextResponse } from 'next/server';
import { inMemoryDb } from '@/lib/db';

export async function GET() {
  const auditRuns = Array.from(inMemoryDb.auditRuns.values());
  const findings = Array.from(inMemoryDb.findings.values());
  const tokenUsages = inMemoryDb.tokenUsages;
  const repositories = Array.from(inMemoryDb.repositories.values());

  const totalAudits = auditRuns.length;
  const totalFindings = findings.length;
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;
  const lowCount = findings.filter(f => f.severity === 'LOW').length;

  const totalTokens = tokenUsages.reduce((acc, curr) => acc + curr.tokensUsed, 0) + auditRuns.reduce((acc, curr) => acc + (curr.tokensUsed || 0), 0);
  const avgLatency = auditRuns.length > 0 ? Math.round(auditRuns.reduce((acc, curr) => acc + curr.durationMs, 0) / auditRuns.length) : 0;

  // Usage trends (mocked 7 days window combined with live logs)
  const usageHistory = [
    { day: 'Mon', tokens: 12400, audits: 8, findings: 14 },
    { day: 'Tue', tokens: 18900, audits: 12, findings: 19 },
    { day: 'Wed', tokens: 15300, audits: 9, findings: 11 },
    { day: 'Thu', tokens: 24100, audits: 15, findings: 22 },
    { day: 'Fri', tokens: 29800, audits: 18, findings: 28 },
    { day: 'Sat', tokens: 8200, audits: 4, findings: 5 },
    { day: 'Sun', tokens: Math.max(14500, totalTokens), audits: Math.max(10, totalAudits), findings: Math.max(12, totalFindings) },
  ];

  const categoryBreakdown = [
    { name: 'SECURITY', value: findings.filter(f => f.category === 'SECURITY').length || 4 },
    { name: 'PERFORMANCE', value: findings.filter(f => f.category === 'PERFORMANCE').length || 2 },
    { name: 'SYNTAX', value: findings.filter(f => f.category === 'SYNTAX').length || 1 },
    { name: 'BEST_PRACTICE', value: findings.filter(f => f.category === 'BEST_PRACTICE').length || 2 },
  ];

  return NextResponse.json({
    kpis: {
      totalAudits,
      totalFindings,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      totalTokens,
      avgLatencyMs: avgLatency,
      activeRepos: repositories.length,
    },
    usageHistory,
    categoryBreakdown,
    repositories,
  });
}
