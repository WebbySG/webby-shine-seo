/**
 * Rate Limiting Middleware for Webby SEO OS
 * 
 * Protects auth, AI generation, and publishing endpoints from abuse.
 * Uses in-memory store (suitable for single-instance deployment).
 * 
 * TODO: For multi-instance deployment, replace with Redis-backed store.
 * Required env vars: none (uses sensible defaults)
 */

import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores: Record<string, Map<string, RateLimitEntry>> = {};

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores[name]) stores[name] = new Map();
  return stores[name];
}

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const store of Object.values(stores)) {
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }
}, 60_000);

interface RateLimitOptions {
  /** Name for the rate limit group */
  name: string;
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export function rateLimiter(options: RateLimitOptions) {
  const { name, maxRequests, windowSeconds } = options;
  const store = getStore(name);

  return (req: Request, res: Response, next: NextFunction) => {
    // Use IP + user ID (if authenticated) as key
    const userId = (req as any).user?.id || "anon";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${ip}:${userId}`;
    const now = Date.now();

    const entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      return next();
    }

    entry.count++;
    const remaining = Math.max(0, maxRequests - entry.count);
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        error: "Too many requests",
        retryAfter,
        limit: maxRequests,
        window: `${windowSeconds}s`,
      });
    }

    next();
  };
}

// ─── Pre-configured limiters ───

/** Auth endpoints: 10 attempts per 15 minutes */
export const authLimiter = rateLimiter({
  name: "auth",
  maxRequests: 10,
  windowSeconds: 900,
});

/** AI generation endpoints: 20 requests per 5 minutes */
export const aiLimiter = rateLimiter({
  name: "ai-generation",
  maxRequests: 20,
  windowSeconds: 300,
});

/** Publishing endpoints: 30 requests per 5 minutes */
export const publishLimiter = rateLimiter({
  name: "publishing",
  maxRequests: 30,
  windowSeconds: 300,
});

/** General API: 200 requests per minute */
export const generalLimiter = rateLimiter({
  name: "general",
  maxRequests: 200,
  windowSeconds: 60,
});
