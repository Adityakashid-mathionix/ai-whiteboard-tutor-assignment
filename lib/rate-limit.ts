import { NextRequest } from "next/server";

/**
 * Fixed-window in-memory rate limiter.
 *
 * Keeps an anonymous deployment from having its server-side NVIDIA key drained
 * by a loop. It is per-instance (serverless instances do not share state), so
 * it is a speed bump rather than a guarantee — swap the store for Redis/KV when
 * running more than one instance.
 *
 * Requests that carry the caller's own API key are limited far more loosely:
 * they spend the caller's quota, not the deployment's.
 */

interface Window {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSeconds: number;
}

export interface RateLimitRule {
  /** Requests permitted inside the window. */
  limit: number;
  windowMs: number;
}

const buckets = new Map<string, Window>();
let lastSweep = 0;

/** Drops expired windows so the map cannot grow without bound. */
function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
}

/** Best-effort client identity from proxy headers. */
export function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  return ip;
}

export function checkRateLimit(
  identifier: string,
  rule: RateLimitRule
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(identifier);

  if (!existing || existing.resetAt <= now) {
    buckets.set(identifier, { count: 1, resetAt: now + rule.windowMs });
    return {
      allowed: true,
      remaining: rule.limit - 1,
      limit: rule.limit,
      retryAfterSeconds: Math.ceil(rule.windowMs / 1000),
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, rule.limit - existing.count);

  return {
    allowed: existing.count <= rule.limit,
    remaining,
    limit: rule.limit,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/** Headers describing the current limit state, for debugging and clients. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    ...(result.allowed ? {} : { "Retry-After": String(result.retryAfterSeconds) }),
  };
}

/** Test seam. */
export function resetRateLimits(): void {
  buckets.clear();
  lastSweep = 0;
}
