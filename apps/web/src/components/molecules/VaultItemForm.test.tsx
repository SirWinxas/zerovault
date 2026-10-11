import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VaultItemForm } from "./VaultItemForm";

const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Site"), "ex.com");
  await user.type(screen.getByLabelText("Username"), "bob");
  await user.type(screen.getByLabelText("Password"), "pw!");
}

describe("VaultItemForm 2FA secret", () => {
  it("submits the normalized secret", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<VaultItemForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await fillRequired(user);
    await user.type(screen.getByLabelText("2FA secret (TOTP)"), "mzxw 6ytb");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      site: "ex.com",
      username: "bob",
      password: "pw!",
      totp: "MZXW6YTB",
    });
  });

  it("blocks submit and shows an alert for an invalid secret", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<VaultItemForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await fillRequired(user);
    await user.type(screen.getByLabelText("2FA secret (TOTP)"), "abc!@#");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("omits totp when the field is empty", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<VaultItemForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("totp");
  });

  it("omits totp after clearing an existing secret", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <VaultItemForm
        initial={{ site: "ex.com", username: "bob", password: "pw!", totp: RFC_SECRET }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );
    await user.clear(screen.getByLabelText("2FA secret (TOTP)"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("totp");
  });
});

describe("VaultItemForm", () => {
  it("renders fields and submits the entered entry", async () => {
    const onSubmit = vi.fn();
    render(<VaultItemForm onSubmit={onSubmit} onCancel={() => {}} />);

    await userEvent.type(screen.getByLabelText(/site/i), "example.com");
    await userEvent.type(screen.getByLabelText(/username/i), "bob");
    await userEvent.type(screen.getByLabelText(/password/i), "pw123");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      site: "example.com",
      username: "bob",
      password: "pw123",
    });
  });
});

describe("VaultItemForm password generator", () => {
  it("fills the password field using the chosen length", async () => {
    render(<VaultItemForm onSubmit={() => {}} onCancel={() => {}} />);
    const length = screen.getByLabelText(/^length$/i);
    await userEvent.clear(length);
    await userEvent.type(length, "24");
    await userEvent.click(screen.getByRole("button", { name: /generate/i }));
    const pw = (screen.getByLabelText(/^password$/i) as HTMLInputElement).value;
    expect(pw).toHaveLength(24);
  });
});
