import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";

/**
 * Throttles auth endpoints per client IP. The default in-memory store is
 * per-instance, which is fine for the single-instance MVP; use a shared store
 * (e.g. Redis) before scaling horizontally.
 */
export function createAuthRateLimiter(opts?: { windowMs?: number; max?: number }): RequestHandler {
  return rateLimit({
    windowMs: opts?.windowMs ?? 60_000,
    limit: opts?.max ?? 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: "TooManyRequests" });
    },
  });
}
