import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { FastifyRequest } from 'fastify';

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

export const RATE_LIMITS = {
  LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  REGISTER: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  REFRESH: { maxRequests: 10, windowMs: 15 * 60 * 1000 },
  FORGOT_PASSWORD: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  RESET_PASSWORD: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  DELETE: { maxRequests: 20, windowMs: 60 * 1000 },
  BULK_DELETE: { maxRequests: 5, windowMs: 60 * 1000 },
  IMPORT: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  EXPORT: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  FILE_UPLOAD: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  AI: { maxRequests: 20, windowMs: 60 * 1000 },
  ADMIN: { maxRequests: 60, windowMs: 60 * 1000 },
  SEARCH: { maxRequests: 60, windowMs: 60 * 1000 },
  MFA_VERIFY: { maxRequests: 5, windowMs: 5 * 60 * 1000 },
  MFA_RECOVERY: { maxRequests: 3, windowMs: 15 * 60 * 1000 },
  SESSIONS_LIST: { maxRequests: 60, windowMs: 60 * 1000 },
  SESSION_REVOKE: { maxRequests: 20, windowMs: 60 * 1000 },
  SESSION_REVOKE_ALL: { maxRequests: 10, windowMs: 60 * 1000 },
  CHANGE_PASSWORD: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  SECURITY_ACTIVITY: { maxRequests: 60, windowMs: 60 * 1000 },
};

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const store = new Map<string, RateLimitRecord>();

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;
let redisClient =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

export function getSharedRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;
  if (url && token) {
    redisClient = new Redis({ url, token });
    return redisClient;
  }
  return null;
}

const ratelimiters = new Map<string, Ratelimit>();

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
) {
  if (redisClient) {
    const key = `${config.windowMs}-${config.maxRequests}`;
    let ratelimit = ratelimiters.get(key);

    if (!ratelimit) {
      ratelimit = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(
          config.maxRequests,
          `${config.windowMs} ms`,
        ),
        analytics: true,
      });
      ratelimiters.set(key, ratelimit);
    }

    const { success, reset } = await ratelimit.limit(identifier);
    return { allowed: success, resetTime: reset };
  }

  const now = Date.now();
  const record = store.get(identifier);

  if (!record || now > record.resetTime) {
    return { allowed: true, resetTime: now + config.windowMs };
  }

  const effectiveMax =
    process.env.NODE_ENV === 'development'
      ? Math.max(config.maxRequests, 100)
      : config.maxRequests;

  if (record.count >= effectiveMax) {
    return { allowed: false, resetTime: record.resetTime };
  }

  return { allowed: true, resetTime: record.resetTime };
}

export async function incrementRateLimit(
  identifier: string,
  config: RateLimitConfig,
) {
  if (redisClient) {
    // Note: When redisClient is active, checkRateLimit already atomically
    // evaluated and consumed the rate limit token via ratelimit.limit(identifier).
    // Calling limit() a second time consumes 2 quota units and adds a duplicate network roundtrip.
    return;
  }

  const now = Date.now();
  const record = store.get(identifier);

  if (record && now <= record.resetTime) {
    record.count++;
  } else {
    store.set(identifier, { count: 1, resetTime: now + config.windowMs });
  }
}

export function resetRateLimit(identifier: string) {
  if (!redisClient) {
    store.delete(identifier);
  }
}

export function getClientIp(req: FastifyRequest | any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  const realIp = req.headers?.['x-real-ip'];

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(',')[0]?.trim();
  }

  if (typeof realIp === 'string') {
    return realIp;
  } else if (Array.isArray(realIp) && realIp.length > 0) {
    return realIp[0];
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}
