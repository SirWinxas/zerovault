import { describe, expect, it } from "vitest";

describe("web sanity", () => {
  it("runs in jsdom", () => {
    expect(typeof document).toBe("object");
  });
});
