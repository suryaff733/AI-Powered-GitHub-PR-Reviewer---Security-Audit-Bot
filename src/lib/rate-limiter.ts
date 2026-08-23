import { inMemoryDb } from './db';

export interface RateLimitCheck {
  allowed: boolean;
  reason?: string;
  tokensRemaining: number;
  resetSeconds: number;
}

export class RateLimiter {
  private static MAX_TOKENS_PER_HOUR = 100000;
  private static MAX_REQUESTS_PER_MINUTE = 20;

  private static requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  public static async checkLimit(repoFullName: string, estimatedTokens: number = 2000): Promise<RateLimitCheck> {
    const now = Date.now();

    // 1. Minute-level request rate limit
    let minuteRecord = this.requestCounts.get(repoFullName);
    if (!minuteRecord || now > minuteRecord.resetTime) {
      minuteRecord = { count: 0, resetTime: now + 60000 };
      this.requestCounts.set(repoFullName, minuteRecord);
    }

    if (minuteRecord.count >= this.MAX_REQUESTS_PER_MINUTE) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: Max ${this.MAX_REQUESTS_PER_MINUTE} PR audits per minute reached.`,
        tokensRemaining: 0,
        resetSeconds: Math.ceil((minuteRecord.resetTime - now) / 1000),
      };
    }

    // 2. Token quota check
    let repo = Array.from(inMemoryDb.repositories.values()).find(r => r.fullName === repoFullName);
    if (!repo) {
      repo = {
        id: `repo-${Date.now()}`,
        owner: repoFullName.split('/')[0] || 'default',
        name: repoFullName.split('/')[1] || repoFullName,
        fullName: repoFullName,
        tokenQuota: this.MAX_TOKENS_PER_HOUR,
        createdAt: new Date(),
      };
      inMemoryDb.repositories.set(repo.id, repo);
    }

    if (repo.tokenQuota < estimatedTokens) {
      return {
        allowed: false,
        reason: `Token quota exhausted: Remaining quota (${repo.tokenQuota}) < estimated job cost (${estimatedTokens}).`,
        tokensRemaining: repo.tokenQuota,
        resetSeconds: 3600,
      };
    }

    return {
      allowed: true,
      tokensRemaining: repo.tokenQuota,
      resetSeconds: Math.ceil((minuteRecord.resetTime - now) / 1000),
    };
  }

  public static async recordTokenUsage(repoFullName: string, tokensUsed: number) {
    // Deduct quota & log usage
    const repo = Array.from(inMemoryDb.repositories.values()).find(r => r.fullName === repoFullName);
    if (repo) {
      repo.tokenQuota = Math.max(0, repo.tokenQuota - tokensUsed);
    }

    inMemoryDb.tokenUsages.push({
      id: `tu-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      repositoryId: repo?.id || 'demo-repo',
      tokensUsed,
      requestCount: 1,
      timestamp: new Date(),
    });

    const minuteRecord = this.requestCounts.get(repoFullName);
    if (minuteRecord) {
      minuteRecord.count++;
    }
  }
}
