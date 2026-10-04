import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { SessionProvider, useSession } from "./session/SessionContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VaultPage from "./pages/VaultPage";

function RequireSession({ children }: { children: ReactNode }) {
  const { session } = useSession();
  return session ? children : <Navigate to="/login" replace />;
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
