import { describe, expect, it } from "vitest";
import { ScryptHasher } from "./scrypt-hasher.js";

describe("ScryptHasher", () => {
  const hasher = new ScryptHasher();

  it("verifies a value against its own hash", async () => {
    const stored = await hasher.hash("secret");
    expect(await hasher.verify("secret", stored)).toBe(true);
  });

  it("rejects a wrong value", async () => {
    const stored = await hasher.hash("secret");
    expect(await hasher.verify("other", stored)).toBe(false);
  });

  it("produces different hashes for the same value (random salt)", async () => {
    expect(await hasher.hash("secret")).not.toBe(await hasher.hash("secret"));
  });

  it("returns false (no throw) for malformed stored strings", async () => {
    for (const bad of ["", "nocolon", ":", "zz:zz", "abcd:", ":abcd", "a:b:c"]) {
      expect(await hasher.verify("secret", bad)).toBe(false);
    }
  });
});
