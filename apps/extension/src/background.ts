import type { AuthParamsResponse, LoginResponse, VaultItemResponse } from "@zerovault/shared-types";
import { decrypt, deriveAuthHash, deriveEncryptionKey, fromBase64 } from "@zerovault/crypto";
import { createApiClient } from "./lib/api";
import type { ItemsResponse, LockResponse, LoginResult, Message, StateResponse } from "./lib/messages";
import type { DecryptedItem, VaultEntry } from "./vault/entry";

// Session lives ONLY in this worker's memory (the key is non-extractable and never persisted).
// An MV3 worker restart drops it and requires re-login; that is intentional.
interface Session {
  email: string;
  token: string;
  key: CryptoKey;
  items: DecryptedItem[];
}
let session: Session | null = null;

async function login(email: string, masterPassword: string): Promise<void> {
  let token: string | null = null;
  const api = createApiClient(() => token);

  const params = await api.get<AuthParamsResponse>(`/auth/params?email=${encodeURIComponent(email)}`);
  const authHash = await deriveAuthHash(masterPassword, fromBase64(params.authSalt), params.kdfParams);
  const res = await api.post<LoginResponse>("/auth/login", { email, authHash });
  token = res.token;
  const key = await deriveEncryptionKey(masterPassword, fromBase64(res.encSalt), res.kdfParams);

  const rows = await api.get<VaultItemResponse[]>("/vault");
  const items: DecryptedItem[] = [];
  for (const row of rows) {
    try {
      const entry = JSON.parse(await decrypt(key, { ciphertext: row.ciphertext, iv: row.iv })) as VaultEntry;
      items.push({ ...entry, id: row.id });
    } catch {
      // Undecryptable item: skipped from listing and matching.
    }
  }
  session = { email, token: res.token, key, items };
}

chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
  // Only accept messages from this extension's own pages (popup).
  if (sender.id !== chrome.runtime.id) return false;
  switch (msg.type) {
    case "LOGIN":
      login(msg.email, msg.masterPassword)
        .then(() => sendResponse({ ok: true } satisfies LoginResult))
        .catch(() => {
          session = null;
          sendResponse({
            ok: false,
            error: "Login failed. Check your credentials and connection.",
          } satisfies LoginResult);
        });
      return true;
    case "STATE":
      sendResponse(
        (session ? { unlocked: true, email: session.email } : { unlocked: false }) satisfies StateResponse,
      );
      return false;
    case "ITEMS":
      sendResponse(
        (session ? { items: session.items } : { items: [], locked: true }) satisfies ItemsResponse,
      );
      return false;
    case "LOCK":
      session = null;
      sendResponse({ ok: true } satisfies LockResponse);
      return false;
    default:
      return false;
  }
});
