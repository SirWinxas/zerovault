// @vitest-environment node
import { describe, expect, it } from "vitest";
import { analyzeVaultHealth, isWeak } from "./health";
import type { DecryptedVaultItem } from "./vault-entry";

const STRONG = "Tr0ub4dor&3-horse";

function item(
  id: string,
  password: string,
  extra: Partial<DecryptedVaultItem> = {},
): DecryptedVaultItem {
  return { id, site: `site-${id}.test`, username: `user-${id}`, password, ...extra };
}

describe("isWeak", () => {
  it("flags passwords shorter than 12 characters", () => {
    expect(isWeak("Ab1!xyZ")).toBe(true);
  });

  it("flags passwords with fewer than 3 character classes", () => {
    expect(isWeak("abcdefghijklmnop")).toBe(true);
    expect(isWeak("abcdefgh12345678")).toBe(true);
  });

  it("flags common passwords regardless of case", () => {
    expect(isWeak("Password")).toBe(true);
    expect(isWeak("QWERTY")).toBe(true);
  });

  it("does not flag a long, varied password", () => {
    expect(isWeak(STRONG)).toBe(false);
  });

  it("treats the empty string as weak", () => {
    expect(isWeak("")).toBe(true);
  });
});

describe("analyzeVaultHealth", () => {
  it("flags every item sharing an exact password as reused", () => {
    const { items, summary } = analyzeVaultHealth([
      item("1", STRONG),
      item("2", STRONG),
      item("3", "Different-Str0ng#pass"),
    ]);
    expect(items.map((i) => i.reused)).toEqual([true, true, false]);
    expect(summary.reused).toBe(2);
  });

  it("does not treat case-different passwords as reused", () => {
    const { summary } = analyzeVaultHealth([
      item("1", STRONG),
      item("2", STRONG.toUpperCase()),
    ]);
    expect(summary.reused).toBe(0);
  });

  it("leaves a unique strong password with neither flag", () => {
    const { items, summary } = analyzeVaultHealth([item("1", STRONG)]);
    expect(items[0]).toMatchObject({ id: "1", weak: false, reused: false });
    expect(summary).toEqual({ total: 1, weak: 0, reused: 0, okay: 1, unreadable: 0 });
  });

  it("counts empty passwords as weak but never reused", () => {
    const { items, summary } = analyzeVaultHealth([item("1", ""), item("2", "")]);
    expect(items.every((i) => i.weak && !i.reused)).toBe(true);
    expect(summary.reused).toBe(0);
    expect(summary.weak).toBe(2);
  });

  it("excludes decryptError items and counts them as unreadable", () => {
    const { items, summary } = analyzeVaultHealth([
      item("1", STRONG),
      item("2", STRONG, { decryptError: true }),
    ]);
    expect(items.map((i) => i.id)).toEqual(["1"]);
    expect(summary).toEqual({ total: 1, weak: 0, reused: 0, okay: 1, unreadable: 1 });
  });

  it("returns an all-zero summary for an empty vault", () => {
    expect(analyzeVaultHealth([])).toEqual({
      items: [],
      summary: { total: 0, weak: 0, reused: 0, okay: 0, unreadable: 0 },
    });
  });

  it("keeps summary counts consistent, allowing items to be both weak and reused", () => {
    const { summary } = analyzeVaultHealth([
      item("1", "password"),
      item("2", "password"),
      item("3", STRONG),
      item("4", "short"),
    ]);
    expect(summary).toEqual({ total: 4, weak: 3, reused: 2, okay: 1, unreadable: 0 });
  });

  it("never exposes password values in its output", () => {
    const out = JSON.stringify(analyzeVaultHealth([item("1", STRONG)]));
    expect(out).not.toContain(STRONG);
  });
});
