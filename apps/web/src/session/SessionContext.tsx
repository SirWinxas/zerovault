import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createApiClient, type ApiClient } from "../lib/api-client";
import { createAuthService, type AuthService } from "../auth/auth-service";
import {
  createSessionStore,
  type Session,
  type SessionStore,
} from "./session-store";

interface SessionContextValue {
  session: Session | null;
  setSession: (session: Session) => void;
  lock: () => void;
  /** Shared API client that attaches the current session token. */
  api: ApiClient;
  auth: AuthService;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
  store,
}: {
  children: ReactNode;
  store?: SessionStore;
}) {
  const storeRef = useRef<SessionStore>(store ?? createSessionStore());
  const [session, setSessionState] = useState<Session | null>(
    storeRef.current.get(),
  );

  const setSession = useCallback((next: Session) => {
    storeRef.current.set(next);
    setSessionState(next);
  }, []);

  const lock = useCallback(() => {
    storeRef.current.lock();
    setSessionState(null);
  }, []);

  const value = useMemo<SessionContextValue>(() => {
    const api = createApiClient(() => storeRef.current.getToken());
    const auth = createAuthService(api, { set: setSession });
    return { session, setSession, lock, api, auth };
  }, [session, setSession, lock]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
