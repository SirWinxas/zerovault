import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { SessionProvider, useSession } from "./session/SessionContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { useAutoLock } from "./session/use-auto-lock";
import VaultPage from "./pages/VaultPage";

/** Mounted only while a session exists, so the timer never runs logged out. */
function AutoLock() {
  const { lock } = useSession();
  useAutoLock(lock);
  return null;
}

function RequireSession({ children }: { children: ReactNode }) {
  const { session } = useSession();
  if (!session) return <Navigate to="/login" replace />;
  return (
    <>
      <AutoLock />
      {children}
    </>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/vault"
            element={
              <RequireSession>
                <VaultPage />
              </RequireSession>
            }
          />
          <Route path="*" element={<Navigate to="/vault" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}
