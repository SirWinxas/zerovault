import cors from "cors";
import express from "express";
import type { ErrorRequestHandler, Router } from "express";
import helmet from "helmet";

type Env = Record<string, string | undefined>;

export interface CreateAppOptions {
  /** Environment to read configuration from (defaults to `process.env`). */
  env?: Env;
  /** Routers mounted before the terminal 404/error handlers. */
  routes?: ReadonlyArray<readonly [path: string, router: Router]>;
}

const isProduction = (env: Env) => env.NODE_ENV === "production";

/**
 * Number of reverse-proxy hops to trust for `req.ip` (and so for per-IP rate
 * limiting). `TRUST_PROXY_HOPS` wins; otherwise 1 in production (Railway's
 * edge proxy) and 0 elsewhere, so a direct client cannot spoof X-Forwarded-For.
 */
export function resolveTrustProxyHops(env: Env): number {
  const raw = env.TRUST_PROXY_HOPS?.trim();
  if (!raw) return isProduction(env) ? 1 : 0;
  if (!/^\d+$/.test(raw)) {
    throw new Error("TRUST_PROXY_HOPS must be a non-negative integer");
  }
  return Number(raw);
}

/**
 * Allowed web origin(s). `WEB_ORIGIN` is a comma-separated list. Production
 * fails closed: it is required there and arbitrary origins are never reflected.
 * Outside production, an unset value reflects any origin for local work.
 */
export function resolveCorsOrigin(env: Env): string[] | true {
  const webOrigin = env.WEB_ORIGIN?.trim();
  if (webOrigin) {
    return webOrigin
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }
  if (isProduction(env)) {
    throw new Error("WEB_ORIGIN environment variable is required in production");
  }
  return true;
}

/** Terminal error handler: generic envelopes only, never stacks or parser details. */
const handleAppError: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) return next(err);
  const status = typeof err?.status === "number" ? err.status : undefined;
  // body-parser errors (malformed JSON, payload too large, ...) carry a 4xx status.
  if (status !== undefined && status >= 400 && status < 500) {
    res.status(status).json({ error: status === 413 ? "PayloadTooLarge" : "BadRequest" });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "InternalError" });
};

export function createApp({ env = process.env, routes = [] }: CreateAppOptions = {}) {
  const app = express();
  app.set("trust proxy", resolveTrustProxyHops(env));

  app.use(helmet());
  app.use(cors({ origin: resolveCorsOrigin(env) }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  for (const [path, router] of routes) {
    app.use(path, router);
  }

  app.use((_req, res) => {
    res.status(404).json({ error: "NotFound" });
  });
  app.use(handleAppError);

  return app;
}
