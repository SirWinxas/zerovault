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

export interface SessionDeps {
  createApi: (getToken: () => string | null) => ApiClient;
  crypto: Pick<typeof realCrypto, "deriveAuthHash" | "deriveEncryptionKey" | "fromBase64" | "decrypt">;
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
  let session: Session | null = null;
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
      if (loginInFlight) throw new Error("Login already in progress");
      loginInFlight = true;
      try {
        // Assigned only after the whole flow succeeds; failures never touch `session`.
        session = await buildSession(email, masterPassword);
      } finally {
        loginInFlight = false;
      }
    },
    state: () => (session ? { unlocked: true, email: session.email } : { unlocked: false }),
    items: () => (session ? { items: session.items } : { items: [], locked: true }),
    lock() {
      session = null;
    },
  };
}
