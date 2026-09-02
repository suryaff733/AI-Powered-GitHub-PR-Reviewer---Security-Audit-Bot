import { PRAuditJobData, inMemoryQueue } from './queue';
import { parseUnifiedDiff } from '../github/diff-parser';
import { GitHubClient, InlineComment } from '../github/octokit';
import { GeminiAuditor } from '../ai/gemini-auditor';
import { RateLimiter } from '../rate-limiter';
import { inMemoryDb, prisma } from '../db';

export async function processPRAuditJob(data: PRAuditJobData) {
  const repoFullName = `${data.owner}/${data.repo}`;
  console.log(`[Worker] Starting processing job ${data.jobId} for PR #${data.pullNumber} (${repoFullName})`);

  // 1. Rate Limiting Check
  const rateLimit = await RateLimiter.checkLimit(repoFullName);
  if (!rateLimit.allowed) {
    console.warn(`[Worker] Job ${data.jobId} rejected due to rate limit: ${rateLimit.reason}`);
    return;
  }

  // 2. Fetch or parse git diffs
  const ghClient = new GitHubClient();
  let fileDiffs = [];

  if (data.rawDiff) {
    fileDiffs = parseUnifiedDiff(data.rawDiff);
  } else {
    const rawFiles = await ghClient.fetchPullRequestFiles(data.owner, data.repo, data.pullNumber);
    const combinedDiff = rawFiles.map(f => `diff --git a/${f.filename} b/${f.filename}\n--- a/${f.filename}\n+++ b/${f.filename}\n${f.patch}`).join('\n');
    fileDiffs = parseUnifiedDiff(combinedDiff);
  }

  if (fileDiffs.length === 0) {
    console.log(`[Worker] Job ${data.jobId}: No diff lines found to audit.`);
    return;
  }

  // 3. Mark Commit Status as Pending
  await ghClient.updateCommitStatus(
    data.owner,
    data.repo,
    data.commitSha,
    'pending',
    'AI Security & Performance Audit in progress...'
  );

  // 4. Run Gemini AI Audit
  const auditor = new GeminiAuditor();
  const auditResult = await auditor.auditPullRequestDiffs(fileDiffs, {
    title: data.prTitle,
    repo: repoFullName,
    prNumber: data.pullNumber,
  });

  // 5. Record Token Usage
  await RateLimiter.recordTokenUsage(repoFullName, auditResult.tokensUsed);

  // 6. Save Audit & Findings to Database
  const repoId = `repo-${data.owner}-${data.repo}`;
  const prId = `pr-${repoId}-${data.pullNumber}`;
  const auditRunId = `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  if (!inMemoryDb.repositories.has(repoId)) {
    inMemoryDb.repositories.set(repoId, {
      id: repoId,
      owner: data.owner,
      name: data.repo,
      fullName: repoFullName,
      tokenQuota: 500000,
      createdAt: new Date(),
    });
  }

  inMemoryDb.pullRequests.set(prId, {
    id: prId,
    repositoryId: repoId,
    prNumber: data.pullNumber,
    title: data.prTitle,
    author: data.author,
    branch: data.branch,
    status: 'OPEN',
    createdAt: new Date(),
  });

  inMemoryDb.auditRuns.set(auditRunId, {
    id: auditRunId,
    pullRequestId: prId,
    commitSha: data.commitSha,
    status: 'COMPLETED',
    durationMs: auditResult.durationMs,
    totalFindings: auditResult.findings.length,
    tokensUsed: auditResult.tokensUsed,
    createdAt: new Date(),
  });

  auditResult.findings.forEach((f, idx) => {
    const findingId = `finding-${auditRunId}-${idx}`;
    inMemoryDb.findings.set(findingId, {
      id: findingId,
      auditRunId,
      filePath: f.filePath,
      lineNumber: f.lineNumber,
      diffPosition: f.diffPosition,
      severity: f.severity,
      category: f.category,
      title: f.title,
      description: f.description,
      codeSnippet: f.codeSnippet,
      suggestedFix: f.suggestedFix,
      createdAt: new Date(),
    });
  });

  // Also persist to Prisma SQLite database
  try {
    const dbRepo = await prisma.repository.upsert({
      where: { fullName: repoFullName },
      update: {},
      create: {
        owner: data.owner,
        name: data.repo,
        fullName: repoFullName,
        tokenQuota: 500000,
      },
    });

    const dbPr = await prisma.pullRequest.upsert({
      where: {
        repositoryId_prNumber: {
          repositoryId: dbRepo.id,
          prNumber: data.pullNumber,
        },
      },
      update: {
        title: data.prTitle,
        author: data.author,
        branch: data.branch,
      },
      create: {
        repositoryId: dbRepo.id,
        prNumber: data.pullNumber,
        title: data.prTitle,
        author: data.author,
        branch: data.branch,
      },
    });

    await prisma.auditRun.create({
      data: {
        pullRequestId: dbPr.id,
        commitSha: data.commitSha,
        status: 'COMPLETED',
        durationMs: auditResult.durationMs,
        totalFindings: auditResult.findings.length,
        tokensUsed: auditResult.tokensUsed,
        findings: {
          create: auditResult.findings.map((f) => ({
            filePath: f.filePath,
            lineNumber: f.lineNumber,
            diffPosition: f.diffPosition,
            severity: f.severity,
            category: f.category,
            title: f.title,
            description: f.description,
            codeSnippet: f.codeSnippet || '',
            suggestedFix: f.suggestedFix || '',
          })),
        },
      },
    });
  } catch (dbErr) {
    console.warn('[Worker] SQLite persistence fallback to inMemoryDb:', dbErr);
  }

  // 7. Post inline review comments on GitHub
  const comments: InlineComment[] = auditResult.findings.map(f => {
    const emoji = f.severity === 'CRITICAL' ? '🚨' : f.severity === 'HIGH' ? '⚠️' : '💡';
    let commentBody = `${emoji} **[AI Audit - ${f.category} (${f.severity})] ${f.title}**\n\n${f.description}`;
    if (f.suggestedFix) {
      commentBody += `\n\n\`\`\`suggestion\n${f.suggestedFix}\n\`\`\``;
    }
    return {
      path: f.filePath,
      line: f.lineNumber,
      side: 'RIGHT',
      body: commentBody,
    };
  });

  await ghClient.postPullRequestReview(
    data.owner,
    data.repo,
    data.pullNumber,
    data.commitSha,
    auditResult.decision,
    `## 🤖 AI PR Security & Performance Audit Report\n\n${auditResult.summary}\n\n* **Audited Files**: ${fileDiffs.length}\n* **Findings Count**: ${auditResult.findings.length}\n* **Tokens Consumed**: ${auditResult.tokensUsed}\n* **Audit Time**: ${auditResult.durationMs}ms`,
    comments
  );

  // 8. Update Commit Status
  const statusState = auditResult.decision === 'REQUEST_CHANGES' ? 'failure' : 'success';
  const statusMessage = auditResult.decision === 'REQUEST_CHANGES'
    ? `Audit Failed: ${auditResult.findings.length} security/code flaw(s) detected.`
    : `Audit Passed: ${auditResult.findings.length} issue(s) found.`;

  await ghClient.updateCommitStatus(
    data.owner,
    data.repo,
    data.commitSha,
    statusState,
    statusMessage
  );

  console.log(`[Worker] Finished processing job ${data.jobId}. Status: ${statusState}, Findings: ${auditResult.findings.length}`);
}

// Auto-register worker processor for in-memory queue
inMemoryQueue.registerProcessor(processPRAuditJob);
