import type { RequestHandler } from "express";
import type { TokenService } from "../../ports/token-service.js";

const BEARER = /^bearer\s+(\S+)$/i;

/** Verifies the Bearer JWT and exposes the subject as `req.userId`. Failures are a clean 401. */
export function createRequireAuth(tokens: TokenService): RequestHandler {
  return async (req, res, next) => {
    const match = BEARER.exec(req.headers.authorization ?? "");
    if (!match) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const { sub } = await tokens.verify(match[1]!);
      req.userId = sub;
    } catch {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  };
}
