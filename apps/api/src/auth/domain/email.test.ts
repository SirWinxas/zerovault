import { describe, expect, it } from "vitest";
import { normalizeEmail } from "./email.js";

describe("normalizeEmail", () => {
  it("trims surrounding whitespace and lowercases", () => {
    expect(normalizeEmail("  A@B.Co ")).toBe("a@b.co");
  });

  it("is idempotent", () => {
    expect(normalizeEmail(normalizeEmail("User@Example.COM"))).toBe("user@example.com");
  });
});
