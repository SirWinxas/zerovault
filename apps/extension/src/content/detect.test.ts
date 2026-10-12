import { describe, expect, it } from "vitest";
import { isFillableField, pickLoginFields } from "./detect";
import type { FieldInfo } from "./detect";

const f = (o: Partial<FieldInfo> = {}): FieldInfo => ({
  type: "text", name: "", id: "", autocomplete: "", placeholder: "", ...o,
});

describe("pickLoginFields", () => {
  it("handles a classic email + password form", () => {
    expect(pickLoginFields([f({ type: "email" }), f({ type: "password" })]))
      .toEqual({ usernameIndex: 0, passwordIndex: 1 });
  });

  it("prefers autocomplete username/email", () => {
    const fields = [f({ name: "login" }), f({ autocomplete: "username" }), f({ type: "password" })];
    expect(pickLoginFields(fields)).toEqual({ usernameIndex: 1, passwordIndex: 2 });
  });

  it("falls back to name/id/placeholder hints", () => {
    const fields = [f({ name: "q" }), f({ id: "user_id" }), f({ name: "city" }), f({ type: "password" })];
    expect(pickLoginFields(fields)).toEqual({ usernameIndex: 1, passwordIndex: 3 });
  });

  it("returns null without a password field", () => {
    expect(pickLoginFields([f({ type: "email" }), f()])).toBeNull();
  });

  it("returns null when no username precedes the password", () => {
    expect(pickLoginFields([f({ type: "password" }), f({ type: "email" })])).toBeNull();
  });

  it("picks the nearest preceding text field", () => {
    const fields = [f({ name: "a" }), f({ name: "b" }), f({ type: "password" })];
    expect(pickLoginFields(fields)).toEqual({ usernameIndex: 1, passwordIndex: 2 });
  });
});

describe("pickLoginFields edge cases", () => {
  it("matches autocomplete with whitespace and mixed case", () => {
    const fields = [f({ name: "login" }), f({ autocomplete: "  Username " }), f({ type: "password" })];
    expect(pickLoginFields(fields)).toEqual({ usernameIndex: 1, passwordIndex: 2 });
  });

  it("uses the first password field when there are two", () => {
    const fields = [f({ type: "email" }), f({ type: "password" }), f({ type: "password" })];
    expect(pickLoginFields(fields)).toEqual({ usernameIndex: 0, passwordIndex: 1 });
  });
});

describe("isFillableField", () => {
  const base = { ...f(), visible: true, enabled: true, formId: 0 };
  it("accepts visible, enabled, non-hidden inputs", () => {
    expect(isFillableField(base)).toBe(true);
  });
  it("rejects hidden, invisible, disabled or readonly inputs", () => {
    expect(isFillableField({ ...base, type: "hidden" })).toBe(false);
    expect(isFillableField({ ...base, visible: false })).toBe(false);
    expect(isFillableField({ ...base, enabled: false })).toBe(false);
  });
});

describe("pickLoginFields form scoping", () => {
  it("rejects a username candidate from a different form than the password", () => {
    const fields = [
      { ...f({ type: "email" }), formId: 1 },
      { ...f({ type: "password" }), formId: 2 },
    ];
    expect(pickLoginFields(fields)).toBeNull();
  });
  it("accepts a username in the same form", () => {
    const fields = [
      { ...f({ type: "email" }), formId: 2 },
      { ...f({ type: "password" }), formId: 2 },
    ];
    expect(pickLoginFields(fields)).toEqual({ usernameIndex: 0, passwordIndex: 1 });
  });
});
