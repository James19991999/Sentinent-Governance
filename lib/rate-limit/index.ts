/**
 * Rate limiter with two backends, selected automatically:
 *
 *  - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN both set → uses
 *    @upstash/ratelimit + @upstash/redis, a real distributed sliding-window
 *    limiter shared across every server instance. This is what you want in
 *    production on Vercel/serverless, where each function invocation may
 *    be a different process with its own memory.
 *  - Neither set → falls back to the in-memory limiter below. Correct
 *    mitigation against a single abusive source on a single long-running
 *    server; NOT a hard global cap across multiple instances, since each
 *    instance has its own counters. Fine for local dev and single-instance
 *    deployments, not a substitute for Upstash at scale.
 *
 * Callers don't need to know or care which backend is active — same
 * function signature either way. This file is the entire integration
 * point; nothing in app/api/** changes when you add Upstash env vars.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

// ---- In-memory fallback backend --------------------------------------

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 5 * 60_000;

function sweepIfDue(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > SWEEP_INTERVAL_MS) buckets.delete(key);
  }
}

function checkRateLimitInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweepIfDue(now);

  const existing = buckets.get(key);
  if (!existing || now - existing.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil((existing.windowStart + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

// ---- Upstash Redis backend ---------------------------------------------

// One Ratelimit instance per distinct (limit, windowMs) pair, memoized —
// @upstash/ratelimit bakes the limit/window into the instance rather than
// taking them per-call, and this app calls checkRateLimit with a few
// different (limit, windowMs) pairs (10/min, 60/min, 5/min).
let upstashAvailable: boolean | null = null;
interface UpstashLimiter {
  limit(key: string): Promise<{ success: boolean; remaining: number; reset: number }>;
}
const limiterCache = new Map<string, UpstashLimiter>();

function isUpstashConfigured(): boolean {
  if (upstashAvailable !== null) return upstashAvailable;
  upstashAvailable = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  return upstashAvailable;
}

async function getUpstashLimiter(limit: number, windowMs: number) {
  const cacheKey = `${limit}:${windowMs}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  const [{ Redis }, { Ratelimit }] = await Promise.all([import("@upstash/redis"), import("@upstash/ratelimit")]);
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    prefix: "sg-ratelimit",
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

async function checkRateLimitUpstash(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const limiter = await getUpstashLimiter(limit, windowMs);
  const result = await limiter.limit(key);
  const retryAfterSeconds = result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return { allowed: result.success, remaining: result.remaining, retryAfterSeconds };
}

// ---- Public API ---------------------------------------------------------

/**
 * @param key Identifier to rate-limit on (e.g. `ip:1.2.3.4` or `uid:abc`).
 * @param limit Max requests allowed within the window.
 * @param windowMs Window size in milliseconds.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (isUpstashConfigured()) {
    try {
      return await checkRateLimitUpstash(key, limit, windowMs);
    } catch (err) {
      // Redis being briefly unreachable shouldn't take the whole API down —
      // fail open to the in-memory limiter for this request rather than 500.
      console.error("Upstash rate limit check failed, falling back to in-memory for this request", err);
      return checkRateLimitInMemory(key, limit, windowMs);
    }
  }
  return checkRateLimitInMemory(key, limit, windowMs);
}

/** Test-only: clears in-memory state and the configured-backend cache between test cases. */
export function _resetRateLimitStateForTests() {
  buckets.clear();
  upstashAvailable = null;
  limiterCache.clear();
}

/** Best-effort caller identifier from a Next.js request, IP first. */
export function identifierFromRequest(req: Request, fallback: string): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  return ip ? `ip:${ip}` : `fallback:${fallback}`;
}
