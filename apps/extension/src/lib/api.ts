// Absolute URL only: the extension has no Vite dev proxy.
const BASE: string = import.meta.env.VITE_API_URL ?? "https://zerovaultweb-production.up.railway.app";

export class ApiError extends Error {
  constructor(public status: number) {
    super(`API error ${status}`);
    this.name = "ApiError";
  }
}

export interface ApiClient {
  get<T = unknown>(path: string): Promise<T>;
  post<T = unknown>(path: string, body: unknown): Promise<T>;
}

export function createApiClient(getToken: () => string | null): ApiClient {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new ApiError(res.status);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
  return {
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
  };
}
