import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { LoginRequestSchema, RegisterRequestSchema } from "@zerovault/shared-types";
import { z, ZodError } from "zod";
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from "../../domain/errors.js";
import type { makeGetAuthParams } from "../../use-cases/get-auth-params.js";
import type { makeLoginUser } from "../../use-cases/login-user.js";
import type { makeRegisterUser } from "../../use-cases/register-user.js";

export interface AuthRouterDeps {
  registerUser: ReturnType<typeof makeRegisterUser>;
  loginUser: ReturnType<typeof makeLoginUser>;
  getAuthParams: ReturnType<typeof makeGetAuthParams>;
}

const ParamsQuerySchema = z.object({ email: z.email() });

/** The single, account-independent response for every accepted registration. */
const REGISTER_ACCEPTED = Object.freeze({});

export function createAuthRouter({ registerUser, loginUser, getAuthParams }: AuthRouterDeps): Router {
  const router = Router();

  router.post("/register", async (req, res) => {
    const input = RegisterRequestSchema.parse(req.body);
    await registerUser(input);
    // Identical response whether or not the email already existed: no user id,
    // no distinguishing status (account existence must stay unobservable).
    res.status(201).json(REGISTER_ACCEPTED);
  });

  router.get("/params", async (req, res) => {
    const { email } = ParamsQuerySchema.parse(req.query);
    const { authSalt, kdfParams } = await getAuthParams(email);
    res.status(200).json({ authSalt, kdfParams });
  });

  router.post("/login", async (req, res) => {
    const input = LoginRequestSchema.parse(req.body);
    const { token, encSalt, kdfParams } = await loginUser(input);
    res.status(200).json({ token, encSalt, kdfParams });
  });

  router.use(handleAuthError);

  return router;
}

function handleAuthError(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "ValidationError", details: err.issues });
  } else if (err instanceof EmailAlreadyRegisteredError) {
    // Defense in depth: "exists" must never surface as a distinct response.
    res.status(201).json(REGISTER_ACCEPTED);
  } else if (err instanceof InvalidCredentialsError) {
    res.status(401).json({ error: "InvalidCredentials" });
  } else {
    console.error("Unhandled auth error:", err);
    res.status(500).json({ error: "InternalError" });
  }
}
