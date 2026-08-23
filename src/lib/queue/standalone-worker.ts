import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { processPRAuditJob } from './worker';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

console.log('[Standalone Worker] Initializing BullMQ Worker process...');

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'pr-audit-queue',
  async job => {
    console.log(`[Standalone Worker] Received job ${job.id} from BullMQ queue`);
    await processPRAuditJob(job.data);
  },
  { connection }
);

worker.on('completed', job => {
  console.log(`[Standalone Worker] Job ${job.id} completed successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`[Standalone Worker] Job ${job?.id} failed:`, err);
});
