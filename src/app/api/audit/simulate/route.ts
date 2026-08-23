import { NextRequest, NextResponse } from 'next/server';
import { parseUnifiedDiff } from '@/lib/github/diff-parser';
import { GeminiAuditor } from '@/lib/ai/gemini-auditor';
import { processPRAuditJob } from '@/lib/queue/worker';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      rawDiff,
      owner = 'acme-corp',
      repo = 'secure-payment-gateway',
      pullNumber = Math.floor(Math.random() * 900) + 100,
      prTitle = 'feat: sandbox test pull request diff',
      author = 'sandbox-user',
      branch = 'feature/sandbox-test',
    } = body;

    if (!rawDiff || typeof rawDiff !== 'string') {
      return NextResponse.json({ error: 'Please provide a valid raw git diff string.' }, { status: 400 });
    }

    const jobId = `sim-${Date.now()}`;
    const jobData = {
      jobId,
      owner,
      repo,
      pullNumber,
      commitSha: `sha-${Math.random().toString(36).substring(7)}`,
      prTitle,
      author,
      branch,
      rawDiff,
      timestamp: Date.now(),
    };

    // Execute audit job
    await processPRAuditJob(jobData);

    const parsedFiles = parseUnifiedDiff(rawDiff);
    const auditor = new GeminiAuditor();
    const result = await auditor.auditPullRequestDiffs(parsedFiles, {
      title: prTitle,
      repo: `${owner}/${repo}`,
      prNumber: pullNumber,
    });

    return NextResponse.json({
      success: true,
      jobId,
      prNumber: pullNumber,
      parsedFilesCount: parsedFiles.length,
      auditResult: result,
    });
  } catch (err: any) {
    console.error('[API Audit Simulate] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to execute audit simulation' }, { status: 500 });
  }
}
