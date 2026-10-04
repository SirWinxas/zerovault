import {
  DEFAULT_KDF_PARAMS,
  deriveAuthHash,
  deriveEncryptionKey,
  fromBase64,
  generateSalt,
  toBase64,
} from "@zerovault/crypto";
import type {
  AuthParamsResponse,
  LoginResponse,
  RegisterRequest,
} from "@zerovault/shared-types";
import type { ApiClient } from "../lib/api-client";
import type { SessionStore } from "../session/session-store";

export interface AuthService {
  login(email: string, masterPassword: string): Promise<void>;
  register(email: string, masterPassword: string): Promise<void>;
}

export function createAuthService(
  api: ApiClient,
  session: Pick<SessionStore, "set">,
): AuthService {
  async function login(email: string, masterPassword: string): Promise<void> {
    const params = await api.get<AuthParamsResponse>(
      `/auth/params?email=${encodeURIComponent(email)}`,
    );
    const authHash = await deriveAuthHash(
      masterPassword,
      fromBase64(params.authSalt),
      params.kdfParams,
    );
    const res = await api.post<LoginResponse>("/auth/login", {
      email,
      authHash,
    });
    const encryptionKey = await deriveEncryptionKey(
      masterPassword,
      fromBase64(res.encSalt),
      res.kdfParams,
    );
    session.set({ email, token: res.token, encryptionKey });
  }

  async function register(
    email: string,
    masterPassword: string,
  ): Promise<void> {
    const authSalt = generateSalt();
    const encSalt = generateSalt();
    const authHash = await deriveAuthHash(masterPassword, authSalt);
    const body: RegisterRequest = {
      email,
      authHash,
      authSalt: toBase64(authSalt),
      encSalt: toBase64(encSalt),
      kdfParams: DEFAULT_KDF_PARAMS,
    };
    await api.post("/auth/register", body);
    // Single place that establishes the session.
    await login(email, masterPassword);
  }

  return { login, register };
}
