// RFC 6238 TOTP (HMAC-SHA1) with RFC 4648 Base32 secrets.
// Zero-knowledge rule: the secret is never logged or included in error messages.

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const INVALID_SECRET = "Invalid TOTP secret";

export interface TotpOptions {
  nowMs?: number;
  digits?: number;
  periodSeconds?: number;
}

export function normalizeSecret(secret: string): string {
  return secret.replace(/\s+/g, "").toUpperCase();
}

function stripPadding(normalized: string): string {
  return normalized.replace(/=+$/, "");
}

export function isValidBase32Secret(secret: string): boolean {
  const body = stripPadding(normalizeSecret(secret));
  return body.length > 0 && /^[A-Z2-7]+$/.test(body);
}

export function decodeBase32(secret: string): Uint8Array<ArrayBuffer> {
  const body = stripPadding(normalizeSecret(secret));
  if (!/^[A-Z2-7]*$/.test(body)) throw new Error(INVALID_SECRET);

  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of body) {
    buffer = (buffer << 5) | ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }
  return new Uint8Array(out);
}

export async function generateTotp(
  secret: string,
  { nowMs = Date.now(), digits = 6, periodSeconds = 30 }: TotpOptions = {},
): Promise<string> {
  if (!isValidBase32Secret(secret)) throw new Error(INVALID_SECRET);
  const keyBytes = decodeBase32(secret);

  const counter = Math.floor(nowMs / 1000 / periodSeconds);
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));

  const offset = mac[mac.length - 1] & 0x0f;
  const binary =
    ((mac[offset] & 0x7f) << 24) |
    (mac[offset + 1] << 16) |
    (mac[offset + 2] << 8) |
    mac[offset + 3];
  return String(binary % 10 ** digits).padStart(digits, "0");
}

export function totpRemainingSeconds(
  nowMs: number = Date.now(),
  periodSeconds = 30,
): number {
  return periodSeconds - (Math.floor(nowMs / 1000) % periodSeconds);
}
