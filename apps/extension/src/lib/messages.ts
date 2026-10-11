import type { DecryptedItem } from "../vault/entry";

export type Message =
  | { type: "LOGIN"; email: string; masterPassword: string }
  | { type: "STATE" }
  | { type: "ITEMS" }
  | { type: "LOCK" };

/** Popup -> content script. One credential, sent transiently on explicit user click. */
export interface FillMessage {
  type: "FILL";
  username: string;
  password: string;
}
export interface FillResponse {
  filled: boolean;
}

export type LoginResult = { ok: true } | { ok: false; error: string };
export interface StateResponse {
  unlocked: boolean;
  email?: string;
}
export interface ItemsResponse {
  items: DecryptedItem[];
  locked?: true;
}
export interface LockResponse {
  ok: true;
}
