import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ApiError } from "../lib/api-client";
import { useAuthSubmit } from "./use-auth-submit";

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

async function failWith(e: unknown) {
  const { result } = renderHook(
    () =>
      useAuthSubmit(async () => {
        throw e;
      }),
    { wrapper },
  );
  await act(() => result.current.submit("a@b.c", "pw"));
  return result.current.error;
}

describe("useAuthSubmit", () => {
  it("maps 401 to a generic credentials message", async () => {
    expect(await failWith(new ApiError(401, null))).toBe(
      "Invalid email or master password.",
    );
  });

  it("never confirms whether an email is already registered (409)", async () => {
    const msg = await failWith(new ApiError(409, null));
    expect(msg).not.toMatch(/already registered/i);
    expect(msg).toBe(
      "Could not complete registration. If you already have an account, log in.",
    );
  });

  it("maps other API errors to a status message and unknown errors generically", async () => {
    expect(await failWith(new ApiError(500, null))).toBe("Request failed (500).");
    expect(await failWith(new Error("boom"))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
