export interface Session {
  email: string;
  token: string;
  encryptionKey: CryptoKey;
}

/**
 * In-memory only. The encryption key (and anything derived from the master
 * password) must NEVER be persisted to localStorage/sessionStorage/IndexedDB/cookies.
 */
export interface SessionStore {
  set(session: Session): void;
  get(): Session | null;
  getToken(): string | null;
  lock(): void;
}

export function createSessionStore(): SessionStore {
  let current: Session | null = null;
  return {
    set: (session) => {
      current = session;
    },
    get: () => current,
    getToken: () => current?.token ?? null,
    lock: () => {
      current = null;
    },
  };
}
