// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PASSWORD_OPTIONS, generatePassword } from "./password-generator";

const LOWER = /[a-z]/;
const UPPER = /[A-Z]/;
const DIGIT = /[0-9]/;
const SYMBOL = /[^a-zA-Z0-9]/;

describe("generatePassword", () => {
  it("uses the default options (length 20, all sets)", () => {
    expect(DEFAULT_PASSWORD_OPTIONS.length).toBe(20);
    expect(generatePassword()).toHaveLength(20);
  });

  it("respects length", () => {
    expect(generatePassword({ length: 4 })).toHaveLength(4);
    expect(generatePassword({ length: 64 })).toHaveLength(64);
  });

  it("only uses chars from enabled sets", () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword({
        length: 30,
        uppercase: false,
        symbols: false,
        digits: false,
      });
      expect(pw).toMatch(/^[a-z]+$/);
    }
    expect(
      generatePassword({ length: 30, lowercase: false, uppercase: false, symbols: false }),
    ).toMatch(/^[0-9]+$/);
  });

  it("includes at least one char from each enabled set, even at minimal length", () => {
    for (let i = 0; i < 100; i++) {
      const pw = generatePassword({ length: 4 });
      expect(pw).toMatch(LOWER);
      expect(pw).toMatch(UPPER);
      expect(pw).toMatch(DIGIT);
      expect(pw).toMatch(SYMBOL);
    }
  });

  it("throws when no set is enabled", () => {
    expect(() =>
      generatePassword({ lowercase: false, uppercase: false, digits: false, symbols: false }),
    ).toThrow(/character set/i);
  });

  it("throws when length < 1 or fewer than enabled sets", () => {
    expect(() => generatePassword({ length: 0 })).toThrow(/length/i);
    expect(() => generatePassword({ length: -3 })).toThrow(/length/i);
    expect(() => generatePassword({ length: 2 })).toThrow(/length/i);
  });

  it("produces different values across calls", () => {
    expect(generatePassword()).not.toBe(generatePassword());
  });

  it("reads randomness from crypto.getRandomValues", () => {
    const spy = vi.spyOn(globalThis.crypto, "getRandomValues");
    generatePassword();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
