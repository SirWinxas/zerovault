import { render, screen } from "@testing-library/react";
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
