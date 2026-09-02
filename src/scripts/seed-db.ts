import { prisma } from '../lib/db';

async function seed() {
  console.log('🌱 Seeding SQLite database (dev.db)...');

  // 1. Create Repository
  const repo = await prisma.repository.upsert({
    where: { fullName: 'acme-corp/secure-payment-gateway' },
    update: {},
    create: {
      owner: 'acme-corp',
      name: 'secure-payment-gateway',
      fullName: 'acme-corp/secure-payment-gateway',
      tokenQuota: 500000,
    },
  });
  console.log(`✓ Repository ready: ${repo.fullName} (${repo.id})`);

  // 2. Create Pull Request
  const pr = await prisma.pullRequest.upsert({
    where: {
      repositoryId_prNumber: {
        repositoryId: repo.id,
        prNumber: 42,
      },
    },
    update: {},
    create: {
      repositoryId: repo.id,
      prNumber: 42,
      title: 'feat: add user authentication and payment checkout endpoint',
      author: 'dev-alex',
      branch: 'feature/auth-checkout',
      status: 'OPEN',
    },
  });
  console.log(`✓ Pull Request ready: PR #${pr.prNumber} (${pr.id})`);

  // 3. Create Audit Run
  const audit = await prisma.auditRun.create({
    data: {
      pullRequestId: pr.id,
      commitSha: 'a8f3b21c',
      status: 'COMPLETED',
      durationMs: 1420,
      totalFindings: 3,
      tokensUsed: 2150,
      findings: {
        create: [
          {
            filePath: 'src/controllers/auth.ts',
            lineNumber: 24,
            diffPosition: 12,
            severity: 'CRITICAL',
            category: 'SECURITY',
            title: 'SQL Injection Vulnerability in User Lookup',
            description: 'Raw string concatenation is used inside SQL query (SELECT * FROM users WHERE email = ...). An attacker can inject arbitrary SQL commands.',
            codeSnippet: `const query = "SELECT * FROM users WHERE email = '" + req.body.email + "' AND password = '" + req.body.password + "'";`,
            suggestedFix: `const user = await prisma.user.findFirst({\n  where: { email: req.body.email, passwordHash }\n});`,
          },
          {
            filePath: 'src/utils/payment.ts',
            lineNumber: 58,
            diffPosition: 28,
            severity: 'HIGH',
            category: 'SECURITY',
            title: 'Hardcoded Secret API Key',
            description: 'Stripe secret key is hardcoded in source code (sk_test_51Mz...). Anyone with access to the repo can extract this key.',
            codeSnippet: `const stripe = new Stripe('sk_test_demo_sample_stripe_secret_key_99');`,
            suggestedFix: `const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);`,
          },
          {
            filePath: 'src/services/report.ts',
            lineNumber: 112,
            diffPosition: 45,
            severity: 'MEDIUM',
            category: 'PERFORMANCE',
            title: 'O(N^2) Synchronous Loop in Array Filter',
            description: 'Synchronous array.find() inside array.forEach() leads to quadratic time complexity O(N^2) on large datasets.',
            codeSnippet: `orders.forEach(o => {\n  const user = users.find(u => u.id === o.userId);\n  o.user = user;\n});`,
            suggestedFix: `const userMap = new Map(users.map(u => [u.id, u]));\norders.forEach(o => { o.user = userMap.get(o.userId); });`,
          },
        ],
      },
    },
    include: {
      findings: true,
    },
  });
  console.log(`✓ Audit Run created: ${audit.id} with ${audit.findings.length} findings`);

  console.log('✅ SQLite database successfully seeded!');
}

seed()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
