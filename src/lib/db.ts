import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// In-memory fallback database for instant zero-config testing
class InMemoryStore {
  public repositories: Map<string, any> = new Map();
  public pullRequests: Map<string, any> = new Map();
  public auditRuns: Map<string, any> = new Map();
  public findings: Map<string, any> = new Map();
  public tokenUsages: any[] = [];
  public webhookLogs: Map<string, any> = new Map();

  constructor() {
    // Seed initial demo data
    const demoRepoId = 'repo-demo-1';
    this.repositories.set(demoRepoId, {
      id: demoRepoId,
      owner: 'acme-corp',
      name: 'secure-payment-gateway',
      fullName: 'acme-corp/secure-payment-gateway',
      tokenQuota: 500000,
      createdAt: new Date(),
    });

    const demoPrId = 'pr-demo-101';
    this.pullRequests.set(demoPrId, {
      id: demoPrId,
      repositoryId: demoRepoId,
      prNumber: 42,
      title: 'feat: add user authentication and payment checkout endpoint',
      author: 'dev-alex',
      branch: 'feature/auth-checkout',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 3600000 * 4),
    });

    const demoAuditId = 'audit-demo-202';
    this.auditRuns.set(demoAuditId, {
      id: demoAuditId,
      pullRequestId: demoPrId,
      commitSha: 'a8f3b21c',
      status: 'COMPLETED',
      durationMs: 1420,
      totalFindings: 3,
      tokensUsed: 2150,
      createdAt: new Date(Date.now() - 3600000 * 3),
    });

    this.findings.set('finding-1', {
      id: 'finding-1',
      auditRunId: demoAuditId,
      filePath: 'src/controllers/auth.ts',
      lineNumber: 24,
      diffPosition: 12,
      severity: 'CRITICAL',
      category: 'SECURITY',
      title: 'SQL Injection Vulnerability in User Lookup',
      description: 'Raw string concatenation is used inside SQL query (`SELECT * FROM users WHERE email = \'${req.body.email}\'`). An attacker can inject arbitrary SQL commands to bypass authentication or dump database data.',
      codeSnippet: `const query = "SELECT * FROM users WHERE email = '" + req.body.email + "' AND password = '" + req.body.password + "'";`,
      suggestedFix: `const user = await prisma.user.findFirst({\n  where: { email: req.body.email, passwordHash }\n});`,
      createdAt: new Date(),
    });

    this.findings.set('finding-2', {
      id: 'finding-2',
      auditRunId: demoAuditId,
      filePath: 'src/utils/payment.ts',
      lineNumber: 58,
      diffPosition: 28,
      severity: 'HIGH',
      category: 'SECURITY',
      title: 'Hardcoded Secret API Key',
      description: 'Stripe secret key is hardcoded in source code (`sk_test_51Mz...`). Anyone with access to the repo can extract this key.',
      codeSnippet: `const stripe = new Stripe('sk_test_demo_sample_stripe_secret_key_99');`,
      suggestedFix: `const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);`,
      createdAt: new Date(),
    });

    this.findings.set('finding-3', {
      id: 'finding-3',
      auditRunId: demoAuditId,
      filePath: 'src/services/report.ts',
      lineNumber: 112,
      diffPosition: 45,
      severity: 'MEDIUM',
      category: 'PERFORMANCE',
      title: 'O(N^2) Synchronous Loop in Array Filter',
      description: 'Synchronous `array.find()` inside `array.forEach()` leads to quadratic time complexity O(N^2) on large datasets.',
      codeSnippet: `orders.forEach(o => {\n  const user = users.find(u => u.id === o.userId);\n  o.user = user;\n});`,
      suggestedFix: `const userMap = new Map(users.map(u => [u.id, u]));\norders.forEach(o => { o.user = userMap.get(o.userId); });`,
      createdAt: new Date(),
    });

    this.webhookLogs.set('wh-demo-1', {
      id: 'wh-demo-1',
      event: 'pull_request',
      action: 'opened',
      deliveryId: 'delivery-9918237',
      payload: JSON.stringify({ prNumber: 42, repo: 'acme-corp/secure-payment-gateway' }),
      status: 'PROCESSED',
      receivedAt: new Date(Date.now() - 3600000 * 4),
    });
  }
}

export const inMemoryDb = new InMemoryStore();
