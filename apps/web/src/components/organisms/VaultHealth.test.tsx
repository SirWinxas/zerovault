import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VaultHealth } from "./VaultHealth";

const STRONG = "Tr0ub4dor&3-horse";
const items = [
  { id: "1", site: "a.test", username: "ann", password: STRONG },
  { id: "2", site: "b.test", username: "bob", password: "password" },
  { id: "3", site: "c.test", username: "cy", password: "password" },
];

describe("VaultHealth", () => {
  it("shows summary counts and flagged items without any password", () => {
    const { container } = render(<VaultHealth items={items} />);
    const region = screen.getByRole("region", { name: /vault health/i });
    expect(within(region).getByText("Weak: 2")).toBeTruthy();
    expect(within(region).getByText("Reused: 2")).toBeTruthy();
    expect(within(region).getByText("Okay: 1")).toBeTruthy();
    expect(within(region).getByText("b.test")).toBeTruthy();
    expect(within(region).queryByText("a.test")).toBeNull();
    expect(container.textContent).not.toContain(STRONG);
    expect(container.textContent).not.toContain("password");
  });

  it("renders nothing for an empty vault", () => {
    const { container } = render(<VaultHealth items={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
