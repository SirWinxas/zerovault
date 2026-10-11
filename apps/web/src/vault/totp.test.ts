// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  decodeBase32,
  generateTotp,
  isValidBase32Secret,
  normalizeSecret,
  totpRemainingSeconds,
} from "./totp";

const text = (b: Uint8Array) => new TextDecoder().decode(b);
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("normalizeSecret", () => {
  it("upper-cases and strips all whitespace", () => {
    expect(normalizeSecret(" mzxw 6ytb\toi\n")).toBe("MZXW6YTBOI");
  });
});

describe("decodeBase32 (RFC 4648 vectors)", () => {
  it.each([
    ["", ""],
    ["MY======", "f"],
    ["MZXQ====", "fo"],
    ["MZXW6===", "foo"],
    ["MZXW6YQ=", "foob"],
    ["MZXW6YTB", "fooba"],
    ["MZXW6YTBOI======", "foobar"],
    ["mzxw 6ytb oi", "foobar"],
  ])("decodes %j", (input, expected) => {
    expect(text(decodeBase32(input))).toBe(expected);
  });

  it("throws a generic error that does not leak the secret", () => {
    const bad = "SECRET-0189!";
    let message = "";
    try {
      decodeBase32(bad);
    } catch (e) {
      message = e instanceof Error ? e.message : String(e);
    }
    expect(message).not.toBe("");
    expect(message).not.toContain(bad);
    expect(message.toUpperCase()).not.toContain("SECRET-0189");
  });
});

describe("isValidBase32Secret", () => {
  it("accepts valid secrets", () => {
    expect(isValidBase32Secret("JBSWY3DP")).toBe(true);
    expect(isValidBase32Secret("mzxw 6ytb")).toBe(true);
  });
  it("rejects secrets too short to decode to any byte, accepts the minimum", () => {
    expect(isValidBase32Secret("A")).toBe(false);
    expect(isValidBase32Secret("ME")).toBe(true);
  });
  it("rejects invalid secrets", () => {
    expect(isValidBase32Secret("")).toBe(false);
    expect(isValidBase32Secret("abc!@#")).toBe(false);
    expect(isValidBase32Secret("8901")).toBe(false);
  });
});

describe("generateTotp (RFC 6238, SHA-1, 6 digits, 30s)", () => {
  it.each([
    [59_000, "287082"],
    [1111111109_000, "081804"],
    [1234567890_000, "005924"],
    [2000000000_000, "279037"],
  ])("at %d ms gives %s", async (nowMs, code) => {
    expect(await generateTotp(RFC_SECRET, { nowMs })).toBe(code);
  });

  it("rejects on an invalid secret", async () => {
    await expect(generateTotp("!!!", { nowMs: 0 })).rejects.toThrow();
  });
});

describe("totpRemainingSeconds", () => {
  it.each([
    [0, 30],
    [1_000, 29],
    [29_000, 1],
    [30_000, 30],
  ])("at %d ms there are %d s left", (nowMs, left) => {
    expect(totpRemainingSeconds(nowMs)).toBe(left);
  });
});
