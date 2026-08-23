import { Queue } from 'bullmq';
import Redis from 'ioredis';

export interface PRAuditJobData {
  jobId: string;
  owner: string;
  repo: string;
  pullNumber: number;
  commitSha: string;
  prTitle: string;
  author: string;
  branch: string;
  rawDiff?: string;
  timestamp: number;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Shared memory queue for local zero-config fallback
class MemoryQueue {
  private jobs: PRAuditJobData[] = [];
  private listeners: ((job: PRAuditJobData) => Promise<void>)[] = [];

  public async add(name: string, data: PRAuditJobData) {
    console.log(`[MemoryQueue] Enqueued job ${data.jobId} for PR #${data.pullNumber} (${data.owner}/${data.repo})`);
    this.jobs.push(data);
    
    // Process asynchronously in background tick
    setTimeout(() => {
      this.dispatchNext();
    }, 10);
    return { id: data.jobId };
  }

  public registerProcessor(processor: (job: PRAuditJobData) => Promise<void>) {
    this.listeners.push(processor);
  }

  private async dispatchNext() {
    const job = this.jobs.shift();
    if (!job) return;
    for (const listener of this.listeners) {
      try {
        await listener(job);
      } catch (err) {
        console.error('[MemoryQueue] Error processing job:', err);
      }
    }
  }

  public getPendingCount(): number {
    return this.jobs.length;
  }
}

export const inMemoryQueue = new MemoryQueue();

let bullQueue: Queue | null = null;
let isRedisConnected = false;

try {
  const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 500,
    retryStrategy: () => null, // don't block process if Redis is absent
  });

  connection.on('connect', () => {
    console.log('[BullMQ] Successfully connected to Redis server at', REDIS_URL);
    isRedisConnected = true;
  });

  connection.on('error', () => {
    isRedisConnected = false;
  });

  bullQueue = new Queue('pr-audit-queue', { connection });
} catch (e) {
  console.log('[BullMQ] Redis unavailable, utilizing in-memory background queue.');
}

export async function enqueuePRAuditJob(data: PRAuditJobData) {
  if (isRedisConnected && bullQueue) {
    await bullQueue.add('audit-pr', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    });
    console.log(`[BullMQ] Enqueued job ${data.jobId} to Redis queue 'pr-audit-queue'`);
    return { queueType: 'BullMQ / Redis', jobId: data.jobId };
  }

  // In-memory fallback
  await inMemoryQueue.add('audit-pr', data);
  return { queueType: 'In-Memory Async Queue', jobId: data.jobId };
}
