import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VaultItemCard } from "./VaultItemCard";

const item = { id: "1", site: "ex.com", username: "bob", password: "pw!" };

describe("VaultItemCard", () => {
  afterEach(() => vi.restoreAllMocks());

  it("copies the password via the clipboard and shows a hint", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockImplementation(writeText);
    render(<VaultItemCard item={item} onEdit={() => {}} onDelete={() => {}} />);
    await user.click(screen.getByRole("button", { name: /copy password/i }));
    expect(writeText).toHaveBeenCalledWith("pw!");
    expect(await screen.findByText(/clears in/i)).toBeTruthy();
  });

  it("shows a 6-digit 2FA code and never the raw secret", async () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    const { container } = render(
      <VaultItemCard
        item={{ ...item, totp: secret }}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    const codeEl = await screen.findByLabelText("2FA code");
    await waitFor(() => expect(codeEl.textContent).toMatch(/^\d{3} \d{3}$/));
    expect(container.innerHTML).not.toContain(secret);
    expect(screen.getByRole("button", { name: /copy 2fa code/i })).toBeTruthy();
  });

  it("shows an invalid note for a corrupt secret", async () => {
    render(
      <VaultItemCard
        item={{ ...item, totp: "!!!" }}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(await screen.findByText(/invalid 2fa secret/i)).toBeTruthy();
  });

  it("renders no 2FA block without a totp", () => {
    render(<VaultItemCard item={item} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.queryByLabelText("2FA code")).toBeNull();
  });

  it("shows tag chips when the item has tags", () => {
    render(
      <VaultItemCard
        item={{ ...item, tags: ["work", "dev"] }}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("work")).toBeTruthy();
    expect(screen.getByText("dev")).toBeTruthy();
  });

  it("renders a decrypt-error row with Delete only", async () => {
    const onDelete = vi.fn();
    render(
      <VaultItemCard
        item={{ id: "2", site: "", username: "", password: "", decryptError: true }}
        onEdit={() => {}}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByText(/unable to decrypt this item/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /show/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /edit/i })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalled();
  });
});
