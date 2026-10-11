import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SessionProvider } from "../session/SessionContext";
import LoginPage from "./LoginPage";

describe("LoginPage", () => {
  it("renders email, master password and a submit button", () => {
    render(
      <SessionProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </SessionProvider>,
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/master password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("prefills the demo account when ?demo=1", () => {
    render(
      <SessionProvider>
        <MemoryRouter initialEntries={["/login?demo=1"]}>
          <LoginPage />
        </MemoryRouter>
      </SessionProvider>,
    );
    expect(screen.getByLabelText(/email/i)).toHaveValue("demo@zerovault.app");
    expect(screen.getByText(/demo account/i)).toBeInTheDocument();
  });
});
