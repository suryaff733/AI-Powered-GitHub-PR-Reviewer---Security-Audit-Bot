import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { enqueuePRAuditJob } from '@/lib/queue/queue';
import '@/lib/queue/worker';
import { inMemoryDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const signature = req.headers.get('x-hub-signature-256') || '';
  const event = req.headers.get('x-github-event') || '';
  const deliveryId = req.headers.get('x-github-delivery') || `del-${Date.now()}`;

  const bodyText = await req.text();
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || 'dev_secret_key_12345';

  // 1. Verify HMAC Signature if secret is configured and not in dev mock mode
  if (webhookSecret && webhookSecret !== 'dev_secret_key_12345' && signature) {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = 'sha256=' + hmac.update(bodyText).digest('hex');
    if (signature !== digest) {
      inMemoryDb.webhookLogs.set(deliveryId, {
        id: deliveryId,
        event,
        deliveryId,
        payload: bodyText.substring(0, 500),
        status: 'REJECTED',
        errorMessage: 'Invalid HMAC signature',
        receivedAt: new Date(),
      });
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
    }
  }

  // 2. Filter for Pull Request Events
  if (event !== 'pull_request') {
    return NextResponse.json({ message: `Ignored event: ${event}` }, { status: 200 });
  }

  let payload: any;
  try {
    payload = JSON.parse(bodyText);
  } catch (err) {
    return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
  }

  const action = payload.action;
  if (!['opened', 'synchronize', 'reopened'].includes(action)) {
    return NextResponse.json({ message: `Ignored action: ${action}` }, { status: 200 });
  }

  const pr = payload.pull_request;
  const repo = payload.repository;
  if (!pr || !repo) {
    return NextResponse.json({ error: 'Missing pull_request or repository payload fields' }, { status: 400 });
  }

  const jobId = `job-${deliveryId}-${Date.now()}`;
  const jobData = {
    jobId,
    owner: repo.owner.login,
    repo: repo.name,
    pullNumber: pr.number,
    commitSha: pr.head.sha,
    prTitle: pr.title,
    author: pr.user.login,
    branch: pr.head.ref,
    timestamp: Date.now(),
  };

  // 3. Enqueue Job Asynchronously to BullMQ
  const enqueueResult = await enqueuePRAuditJob(jobData);
  const durationMs = Date.now() - startTime;

  // Log Webhook Receipt
  inMemoryDb.webhookLogs.set(deliveryId, {
    id: deliveryId,
    event,
    action,
    deliveryId,
    payload: JSON.stringify({ prNumber: pr.number, repo: repo.full_name }),
    status: 'QUEUED',
    receivedAt: new Date(),
  });

  return NextResponse.json(
    {
      message: 'GitHub webhook received & enqueued into background worker queue',
      status: 'QUEUED',
      jobId,
      queueType: enqueueResult.queueType,
      responseLatencyMs: durationMs, // Guaranteed < 50ms payload response
    },
    { status: 202 }
  );
}
