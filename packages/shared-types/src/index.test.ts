import { describe, expect, it } from "vitest";
import { LoginRequestSchema } from "./index";

describe("shared-types", () => {
  it("validates a login request", () => {
    const parsed = LoginRequestSchema.safeParse({ email: "a@b.co", authHash: "x" });
    expect(parsed.success).toBe(true);
  });
});
