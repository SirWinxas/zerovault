export type Message =
  | { type: "LOGIN"; email: string; masterPassword: string }
  | { type: "STATE" }
  | { type: "ITEMS" }
  | { type: "FILL"; id: string; tabId: number }
  | { type: "COPY"; id: string; field: "username" | "password" }
  | { type: "LOCK" };

/** Background -> content script. One credential, resolved in the background after an origin check. */
export interface FillMessage {
  type: "FILL";
  site: string;
  username: string;
  password: string;
}
export interface FillResponse {
  filled: boolean;
}
/** Background -> popup answer to a FILL request. */
export type FillResult = FillResponse;

export type LoginResult = { ok: true } | { ok: false; error: string };
export interface StateResponse {
  unlocked: boolean;
  email?: string;
}
/** What the popup may see about an item: never secrets. */
export interface ItemLabel {
  id: string;
  site: string;
  username: string;
}
export interface ItemsResponse {
  items: ItemLabel[];
  locked?: true;
}
export type CopyResponse = { value: string } | { error: string };
export interface LockResponse {
  ok: true;
}
