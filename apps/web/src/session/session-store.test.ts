import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionStore } from "./session-store";

const key = {} as CryptoKey;

afterEach(() => vi.restoreAllMocks());

describe("session store", () => {
  it("starts empty", () => {
    const s = createSessionStore();
    expect(s.get()).toBeNull();
    expect(s.getToken()).toBeNull();
  });

  it("set then get/getToken", () => {
    const s = createSessionStore();
    s.set({ email: "a@b.c", token: "t", encryptionKey: key });
    expect(s.get()).toEqual({ email: "a@b.c", token: "t", encryptionKey: key });
    expect(s.getToken()).toBe("t");
  });

  it("lock() wipes the session", () => {
    const s = createSessionStore();
    s.set({ email: "a@b.c", token: "t", encryptionKey: key });
    s.lock();
    expect(s.get()).toBeNull();
    expect(s.getToken()).toBeNull();
  });

  it("never writes to web storage", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const s = createSessionStore();
    s.set({ email: "a@b.c", token: "t", encryptionKey: key });
    s.lock();
    expect(setItem).not.toHaveBeenCalled();
  });
});
