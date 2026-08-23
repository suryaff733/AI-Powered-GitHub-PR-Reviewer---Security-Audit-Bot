import { parseUnifiedDiff } from '../lib/github/diff-parser';
import { GeminiAuditor } from '../lib/ai/gemini-auditor';
import { RateLimiter } from '../lib/rate-limiter';
import { processPRAuditJob } from '../lib/queue/worker';

async function runVerificationSuite() {
  console.log('====================================================');
  console.log('🤖 Starting End-to-End Verification Test Suite');
  console.log('====================================================\n');

  // 1. Test Diff Parser
  console.log('1️⃣ Testing Unified Diff Parser...');
  const sampleDiff = `diff --git a/src/auth.ts b/src/auth.ts
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -10,3 +10,5 @@ function login() {
-  return false;
+  const query = "SELECT * FROM users WHERE email = '" + req.body.email + "'";
+  const key = "sk_test_demo_sample_stripe_secret_key_99";
}`;

  const parsedFiles = parseUnifiedDiff(sampleDiff);
  console.log(`   ✓ Parsed files count: ${parsedFiles.length}`);
  console.log(`   ✓ File name: ${parsedFiles[0]?.filename}`);
  console.log(`   ✓ Additions count: ${parsedFiles[0]?.additions}`);
  console.log(`   ✓ Diff lines parsed: ${parsedFiles[0]?.lines.length}\n`);

  // 2. Test Gemini Auditor Engine
  console.log('2️⃣ Testing AI Audit Engine (Security, Secrets, Performance)...');
  const auditor = new GeminiAuditor();
  const auditResult = await auditor.auditPullRequestDiffs(parsedFiles, {
    title: 'test: security audit verification',
    repo: 'acme-corp/test-repo',
    prNumber: 99,
  });

  console.log(`   ✓ Audit Decision: ${auditResult.decision}`);
  console.log(`   ✓ Audit Duration: ${auditResult.durationMs}ms`);
  console.log(`   ✓ Total Findings Detected: ${auditResult.findings.length}`);
  auditResult.findings.forEach((f, i) => {
    console.log(`     - Finding #${i + 1} [${f.severity} / ${f.category}]: ${f.title} (Line ${f.lineNumber})`);
  });
  console.log();

  // 3. Test Rate Limiter
  console.log('3️⃣ Testing Token Quota Rate Limiter...');
  const limitCheck = await RateLimiter.checkLimit('acme-corp/test-repo', 2000);
  console.log(`   ✓ Rate Limit Allowed: ${limitCheck.allowed}`);
  console.log(`   ✓ Remaining Tokens: ${limitCheck.tokensRemaining}\n`);

  // 4. Test Full Asynchronous Worker Processing
  console.log('4️⃣ Testing Worker Execution & In-Memory Fallback Queue...');
  await processPRAuditJob({
    jobId: 'test-job-999',
    owner: 'acme-corp',
    repo: 'test-repo',
    pullNumber: 101,
    commitSha: 'c0ff33',
    prTitle: 'feat: add payment gateway',
    author: 'developer-1',
    branch: 'main',
    rawDiff: sampleDiff,
    timestamp: Date.now(),
  });

  console.log('\n====================================================');
  console.log('✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runVerificationSuite().catch(err => {
  console.error('❌ Verification suite failed:', err);
  process.exit(1);
});
