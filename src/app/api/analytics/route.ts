import { NextResponse } from 'next/server';
import { prisma, inMemoryDb } from '@/lib/db';

export async function GET() {
  let totalAudits = 0;
  let totalFindings = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let totalTokens = 0;
  let avgLatency = 0;
  let activeRepos = 0;
  let repositories: any[] = [];
  let findingsList: any[] = [];

  try {
    const [dbAudits, dbFindings, dbRepos] = await Promise.all([
      prisma.auditRun.findMany(),
      prisma.finding.findMany(),
      prisma.repository.findMany(),
    ]);

    if (dbAudits.length > 0 || dbRepos.length > 0) {
      totalAudits = dbAudits.length;
      totalFindings = dbFindings.length;
      criticalCount = dbFindings.filter(f => f.severity === 'CRITICAL').length;
      highCount = dbFindings.filter(f => f.severity === 'HIGH').length;
      mediumCount = dbFindings.filter(f => f.severity === 'MEDIUM').length;
      lowCount = dbFindings.filter(f => f.severity === 'LOW').length;
      totalTokens = dbAudits.reduce((acc, curr) => acc + (curr.tokensUsed || 0), 0);
      avgLatency = dbAudits.length > 0 ? Math.round(dbAudits.reduce((acc, curr) => acc + curr.durationMs, 0) / dbAudits.length) : 0;
      activeRepos = dbRepos.length;
      repositories = dbRepos;
      findingsList = dbFindings;
    }
  } catch (err) {
    console.warn('[Analytics API] SQLite query error, using in-memory store:', err);
  }

  if (totalAudits === 0 && inMemoryDb.auditRuns.size > 0) {
    const auditRuns = Array.from(inMemoryDb.auditRuns.values());
    const findings = Array.from(inMemoryDb.findings.values());
    const tokenUsages = inMemoryDb.tokenUsages;
    repositories = Array.from(inMemoryDb.repositories.values());

    totalAudits = auditRuns.length;
    totalFindings = findings.length;
    criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
    highCount = findings.filter(f => f.severity === 'HIGH').length;
    mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;
    lowCount = findings.filter(f => f.severity === 'LOW').length;
    totalTokens = tokenUsages.reduce((acc, curr) => acc + curr.tokensUsed, 0) + auditRuns.reduce((acc, curr) => acc + (curr.tokensUsed || 0), 0);
    avgLatency = auditRuns.length > 0 ? Math.round(auditRuns.reduce((acc, curr) => acc + curr.durationMs, 0) / auditRuns.length) : 0;
    activeRepos = repositories.length;
    findingsList = findings;
  }

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
    { name: 'SECURITY', value: findingsList.filter(f => f.category === 'SECURITY').length || 4 },
    { name: 'PERFORMANCE', value: findingsList.filter(f => f.category === 'PERFORMANCE').length || 2 },
    { name: 'SYNTAX', value: findingsList.filter(f => f.category === 'SYNTAX').length || 1 },
    { name: 'BEST_PRACTICE', value: findingsList.filter(f => f.category === 'BEST_PRACTICE').length || 2 },
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
