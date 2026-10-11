import type { AuthParamsResponse, LoginResponse, VaultItemResponse } from "@zerovault/shared-types";
import * as realCrypto from "@zerovault/crypto";
import { createApiClient, type ApiClient } from "../lib/api";
import type { ItemsResponse, StateResponse } from "../lib/messages";
import type { DecryptedItem, VaultEntry } from "../vault/entry";

// Session lives ONLY in memory (the key is non-extractable and never persisted).
// An MV3 worker restart drops it and requires re-login; that is intentional.
interface Session {
  email: string;
  token: string;
  key: CryptoKey;
  items: DecryptedItem[];
}

/** Thrown when a login is attempted while another is still pending. */
export class LoginInProgressError extends Error {
  constructor() {
    super("Login already in progress");
    this.name = "LoginInProgressError";
  }
}

export const DEFAULT_IDLE_MS = 15 * 60 * 1000;

export interface SessionDeps {
  createApi: (getToken: () => string | null) => ApiClient;
  crypto: Pick<typeof realCrypto, "deriveAuthHash" | "deriveEncryptionKey" | "fromBase64" | "decrypt">;
  /** Inactivity window before the vault locks itself. */
  idleMs: number;
  now: () => number;
}

export interface SessionManager {
  /** Throws on failure; an existing session is left untouched in that case. */
  login(email: string, masterPassword: string): Promise<void>;
  state(): StateResponse;
  items(): ItemsResponse;
  lock(): void;
}

export function createSessionManager(deps: Partial<SessionDeps> = {}): SessionManager {
  const createApi = deps.createApi ?? createApiClient;
  const c = deps.crypto ?? realCrypto;
  const idleMs = deps.idleMs ?? DEFAULT_IDLE_MS;
  const now = deps.now ?? Date.now;
  let session: Session | null = null;
  let lastActivity = 0;

  /** Locks and returns false when idle past the limit. */
  function alive(): boolean {
    if (session && now() - lastActivity > idleMs) session = null;
    return session !== null;
  }
  // Concurrency guard: a login while another is pending is REJECTED (not queued),
  // so two attempts can never interleave or overwrite each other's result.
  let loginInFlight = false;

  async function buildSession(email: string, masterPassword: string): Promise<Session> {
    let token: string | null = null;
    const api = createApi(() => token);

    const params = await api.get<AuthParamsResponse>(`/auth/params?email=${encodeURIComponent(email)}`);
    const authHash = await c.deriveAuthHash(masterPassword, c.fromBase64(params.authSalt), params.kdfParams);
    const res = await api.post<LoginResponse>("/auth/login", { email, authHash });
    token = res.token;
    const key = await c.deriveEncryptionKey(masterPassword, c.fromBase64(res.encSalt), res.kdfParams);

    const rows = await api.get<VaultItemResponse[]>("/vault");
    const items: DecryptedItem[] = [];
    for (const row of rows) {
      try {
        const entry = JSON.parse(await c.decrypt(key, { ciphertext: row.ciphertext, iv: row.iv })) as VaultEntry;
        items.push({ ...entry, id: row.id });
      } catch {
        // Undecryptable item: skipped from listing and matching.
      }
    }
    return { email, token: res.token, key, items };
  }

  return {
    async login(email, masterPassword) {
      if (loginInFlight) throw new LoginInProgressError();
      loginInFlight = true;
      try {
        // Assigned only after the whole flow succeeds; failures never touch `session`.
        session = await buildSession(email, masterPassword);
        lastActivity = now();
      } finally {
        loginInFlight = false;
      }
    },
    state: () => (alive() && session ? { unlocked: true, email: session.email } : { unlocked: false }),
    items() {
      if (!alive() || !session) return { items: [], locked: true };
      lastActivity = now();
      return { items: session.items };
    },
    lock() {
      session = null;
    },
  };
}
