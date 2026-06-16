import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

let distributedRatelimit: Ratelimit | null | undefined;

function checkInMemoryRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + WINDOW_MS;
    rateLimitStore.set(userId, { count: 1, resetAt });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  rateLimitStore.set(userId, entry);
  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}

function getDistributedRatelimit(): Ratelimit | null {
  if (distributedRatelimit !== undefined) {
    return distributedRatelimit;
  }

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    distributedRatelimit = null;
    return null;
  }

  distributedRatelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, `${WINDOW_MS} ms`),
    prefix: 'ai-financial-agent:chat',
  });

  return distributedRatelimit;
}

export async function checkRateLimit(
  userId: string,
): Promise<RateLimitResult> {
  const limiter = getDistributedRatelimit();

  if (!limiter) {
    return checkInMemoryRateLimit(userId);
  }

  const result = await limiter.limit(userId);

  return {
    allowed: result.success,
    remaining: result.remaining,
    resetAt: result.reset,
  };
}
