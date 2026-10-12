import { describe, expect, it } from "vitest";
import { assertKdfPolicy } from "./kdf-policy";

describe("assertKdfPolicy", () => {
  it("accepts the minimum, a typical and the maximum iteration count", () => {
    for (const iterations of [600_000, 1_000_000, 10_000_000]) {
      expect(() => assertKdfPolicy({ iterations, hash: "SHA-256" })).not.toThrow();
    }
  });

  it("rejects a downgraded iteration count", () => {
    expect(() => assertKdfPolicy({ iterations: 1, hash: "SHA-256" })).toThrow(
      "Unsafe key derivation parameters",
    );
    expect(() => assertKdfPolicy({ iterations: 599_999, hash: "SHA-256" })).toThrow(
      "Unsafe key derivation parameters",
    );
  });

  it("rejects an excessive (DoS) iteration count", () => {
    expect(() =>
      assertKdfPolicy({ iterations: 10_000_001, hash: "SHA-256" }),
    ).toThrow("Unsafe key derivation parameters");
  });

  it("rejects non-integer or non-numeric iterations", () => {
    expect(() =>
      assertKdfPolicy({ iterations: 600_000.5, hash: "SHA-256" }),
    ).toThrow("Unsafe key derivation parameters");
    expect(() =>
      assertKdfPolicy({ iterations: "600000", hash: "SHA-256" } as never),
    ).toThrow("Unsafe key derivation parameters");
  });

  it("rejects a different hash", () => {
    expect(() =>
      assertKdfPolicy({ iterations: 600_000, hash: "SHA-1" } as never),
    ).toThrow("Unsafe key derivation parameters");
  });

  it("rejects missing params", () => {
    expect(() => assertKdfPolicy(undefined as never)).toThrow(
      "Unsafe key derivation parameters",
    );
  });
});
