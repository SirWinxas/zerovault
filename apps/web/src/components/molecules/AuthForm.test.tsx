import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthForm } from "./AuthForm";

const STRONG = "Tr0ub4dor&3-horse-battery";

function setup(mode?: "register") {
  const onSubmit = vi.fn();
  render(
    <AuthForm
      title="t"
      submitLabel="Go"
      pending={false}
      error={null}
      onSubmit={onSubmit}
      mode={mode}
    />,
  );
  return { onSubmit, user: userEvent.setup() };
}

describe("AuthForm login mode", () => {
  it("has no confirm field, current-password autocomplete, and submits", async () => {
    const { onSubmit, user } = setup();
    expect(screen.queryByLabelText(/confirm/i)).not.toBeInTheDocument();
    const pw = screen.getByLabelText(/master password/i);
    expect(pw).toHaveAttribute("autocomplete", "current-password");
    await user.type(screen.getByLabelText(/email/i), "a@b.co");
    await user.type(pw, "weak");
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onSubmit).toHaveBeenCalledWith("a@b.co", "weak");
  });
});

describe("AuthForm register mode", () => {
  it("uses new-password autocomplete on both fields", () => {
    setup("register");
    expect(screen.getByLabelText(/^master password/i)).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText(/confirm master password/i)).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
  });

  it("blocks submit with an alert when the passwords do not match", async () => {
    const { onSubmit, user } = setup("register");
    await user.type(screen.getByLabelText(/email/i), "a@b.co");
    await user.type(screen.getByLabelText(/^master password/i), STRONG);
    await user.type(screen.getByLabelText(/confirm master password/i), STRONG + "x");
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/do not match/i);
  });

  it("blocks submit with an alert when the master password is weak", async () => {
    const { onSubmit, user } = setup("register");
    await user.type(screen.getByLabelText(/email/i), "a@b.co");
    await user.type(screen.getByLabelText(/^master password/i), "abc123");
    await user.type(screen.getByLabelText(/confirm master password/i), "abc123");
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/too weak/i);
  });

  it("submits when matching and strong", async () => {
    const { onSubmit, user } = setup("register");
    await user.type(screen.getByLabelText(/email/i), "a@b.co");
    await user.type(screen.getByLabelText(/^master password/i), STRONG);
    await user.type(screen.getByLabelText(/confirm master password/i), STRONG);
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onSubmit).toHaveBeenCalledWith("a@b.co", STRONG);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
