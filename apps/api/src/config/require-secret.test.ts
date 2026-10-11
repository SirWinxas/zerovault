import { describe, expect, it } from "vitest";
import { requireSecret } from "./require-secret.js";

describe("requireSecret", () => {
  it("returns the value when it meets the minimum length", () => {
    const value = "x".repeat(32);
    expect(requireSecret("JWT_SECRET", value, 32)).toBe(value);
  });

  it("throws a clear message naming the variable when missing", () => {
    expect(() => requireSecret("AUTH_PEPPER", undefined, 32)).toThrow(
      "AUTH_PEPPER environment variable is required and must be at least 32 characters",
    );
  });

  it("throws when too short, without echoing the secret value", () => {
    let message = "";
    try {
      requireSecret("JWT_SECRET", "short-secret-value", 32);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/JWT_SECRET .*at least 32 characters/);
    expect(message).not.toContain("short-secret-value");
  });
});
