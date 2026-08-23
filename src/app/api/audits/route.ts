import { NextResponse } from 'next/server';
import { inMemoryDb } from '@/lib/db';

export async function GET() {
  const auditRuns = Array.from(inMemoryDb.auditRuns.values());
  const pullRequests = inMemoryDb.pullRequests;
  const repositories = inMemoryDb.repositories;
  const findings = Array.from(inMemoryDb.findings.values());
  const webhookLogs = Array.from(inMemoryDb.webhookLogs.values());

  const fullAudits = auditRuns.map(audit => {
    const pr = pullRequests.get(audit.pullRequestId);
    const repo = pr ? repositories.get(pr.repositoryId) : null;
    const auditFindings = findings.filter(f => f.auditRunId === audit.id);

    return {
      ...audit,
      pullRequest: pr || null,
      repository: repo || null,
      findings: auditFindings,
    };
  });

  return NextResponse.json({
    audits: fullAudits,
    webhookLogs,
  });
}
