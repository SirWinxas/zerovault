import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VaultItemForm } from "./VaultItemForm";

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
