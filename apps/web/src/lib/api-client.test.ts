import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createApiClient } from "./api-client";

function mockFetch(status: number, body?: unknown) {
  const fn = vi
    .fn()
    .mockImplementation(async () =>
      new Response(body === undefined ? null : JSON.stringify(body), { status }),
    );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("api client", () => {
  it("adds a Bearer token when present", async () => {
    const fetchMock = mockFetch(200, { ok: true });
    await createApiClient(() => "tok").get("/x");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/x");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("omits Authorization when there is no token", async () => {
    const fetchMock = mockFetch(200, {});
    await createApiClient(() => null).get("/x");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("parses JSON on 200 and sends JSON bodies", async () => {
    const fetchMock = mockFetch(200, { a: 1 });
    const out = await createApiClient(() => null).post("/x", { b: 2 });
    expect(out).toEqual({ a: 1 });
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ b: 2 }));
  });

  it("uses PUT and DELETE verbs", async () => {
    const fetchMock = mockFetch(200, {});
    const api = createApiClient(() => null);
    await api.put("/x", {});
    await api.del("/x");
    expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
    expect(fetchMock.mock.calls[1][1].method).toBe("DELETE");
  });

  it("returns undefined on 204", async () => {
    mockFetch(204);
    expect(await createApiClient(() => null).del("/x")).toBeUndefined();
  });

  it("throws ApiError with status and body on non-2xx", async () => {
    mockFetch(401, { error: "nope" });
    const err = await createApiClient(() => null)
      .get("/x")
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
    expect((err as ApiError).body).toEqual({ error: "nope" });
  });

  it("uses a null body when the error response is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("oops", { status: 500 })),
    );
    const err = await createApiClient(() => null)
      .get("/x")
      .catch((e: unknown) => e);
    expect((err as ApiError).status).toBe(500);
    expect((err as ApiError).body).toBeNull();
  });
});
