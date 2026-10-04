import { describe, expect, it } from "vitest";
import { createDecoy } from "./decoy.js";

describe("createDecoy", () => {
  it("derives a deterministic salt per email", () => {
    const decoy = createDecoy("test-pepper");
    expect(decoy.saltFor("a@b.co")).toBe(decoy.saltFor("a@b.co"));
  });

  it("derives different salts for different emails", () => {
    const decoy = createDecoy("test-pepper");
    expect(decoy.saltFor("a@b.co")).not.toBe(decoy.saltFor("c@d.co"));
  });

  it("derives different salts for different peppers", () => {
    expect(createDecoy("p1").saltFor("a@b.co")).not.toBe(createDecoy("p2").saltFor("a@b.co"));
  });

  it("produces a base64 salt that decodes to 16 bytes", () => {
    const salt = createDecoy("test-pepper").saltFor("a@b.co");
    expect(Buffer.from(salt, "base64")).toHaveLength(16);
    expect(Buffer.from(salt, "base64").toString("base64")).toBe(salt);
  });

  it("exposes the default client kdf params", () => {
    expect(createDecoy("test-pepper").kdfParams).toEqual({ iterations: 600000, hash: "SHA-256" });
  });

  it("builds a hash in the ScryptHasher stored format", () => {
    expect(createDecoy("test-pepper").hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
  });
});
