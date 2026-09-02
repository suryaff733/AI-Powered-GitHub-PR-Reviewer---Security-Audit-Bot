import { NextResponse } from 'next/server';
import { prisma, inMemoryDb } from '@/lib/db';

export async function GET() {
  try {
    const dbAudits = await prisma.auditRun.findMany({
      include: {
        pullRequest: {
          include: {
            repository: true,
          },
        },
        findings: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (dbAudits.length > 0) {
      const webhookLogs = Array.from(inMemoryDb.webhookLogs.values());
      const mapped = dbAudits.map(audit => ({
        ...audit,
        pullRequest: audit.pullRequest || null,
        repository: audit.pullRequest?.repository || null,
        findings: audit.findings || [],
      }));

      return NextResponse.json({
        audits: mapped,
        webhookLogs,
        source: 'supabase-postgresql',
      });
    }
  } catch (err) {
    console.warn('[Audits API] Fallback to in-memory store:', err);
  }

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
    source: 'in-memory',
  });
}
