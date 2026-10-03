/**
 * ZeroVault crypto core.
 *
 * Runs unchanged in browsers and Node (Web Crypto only, no Buffer).
 * The master password and derived key material never leave the client:
 *  - the encryption key is a NON-extractable AES-GCM CryptoKey;
 *  - the auth hash is derived with a SEPARATE salt, so the server never
 *    learns anything that helps recover the encryption key.
 */

export interface KdfParams {
  iterations: number;
  hash: "SHA-256";
}

export const DEFAULT_KDF_PARAMS: KdfParams = {
  iterations: 600000,
  hash: "SHA-256",
};

/** Both fields are base64. */
export interface Encrypted {
  ciphertext: string;
  iv: string;
}

const SALT_BYTES = 16;
const IV_BYTES = 12; // 96-bit IV, the recommended size for AES-GCM
const AUTH_HASH_BITS = 256;
const AES_KEY_BITS = 256;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

// --- encoding / randomness helpers -----------------------------------------

export function generateSalt(bytes: number = SALT_BYTES): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(bytes));
}

export function generateIv(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_BYTES));
}

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// --- private helpers --------------------------------------------------------

function utf8(text: string): Uint8Array {
  return textEncoder.encode(text);
}

/** Import the master password as a non-extractable PBKDF2 base key. */
function importPasswordKey(
  masterPassword: string,
  usage: "deriveKey" | "deriveBits",
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    utf8(masterPassword) as BufferSource,
    "PBKDF2",
    false,
    [usage],
  );
}

function pbkdf2Params(
  salt: Uint8Array,
  params: KdfParams,
): Pbkdf2Params {
  return {
    name: "PBKDF2",
    salt: salt as BufferSource,
    iterations: params.iterations,
    hash: params.hash,
  };
}

// --- key derivation ---------------------------------------------------------

/** Derive the vault encryption key. The result is non-extractable. */
export async function deriveEncryptionKey(
  masterPassword: string,
  salt: Uint8Array,
  params: KdfParams = DEFAULT_KDF_PARAMS,
): Promise<CryptoKey> {
  const baseKey = await importPasswordKey(masterPassword, "deriveKey");
  return crypto.subtle.deriveKey(
    pbkdf2Params(salt, params),
    baseKey,
    { name: "AES-GCM", length: AES_KEY_BITS },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Derive the server-side authentication hash (base64). The caller MUST pass
 * a salt different from the one used for the encryption key.
 */
export async function deriveAuthHash(
  masterPassword: string,
  salt: Uint8Array,
  params: KdfParams = DEFAULT_KDF_PARAMS,
): Promise<string> {
  const baseKey = await importPasswordKey(masterPassword, "deriveBits");
  const bits = await crypto.subtle.deriveBits(
    pbkdf2Params(salt, params),
    baseKey,
    AUTH_HASH_BITS,
  );
  return toBase64(new Uint8Array(bits));
}

// --- authenticated encryption ----------------------------------------------

/** AES-256-GCM with a fresh random IV on every call. */
export async function encrypt(
  key: CryptoKey,
  plaintext: string,
): Promise<Encrypted> {
  const iv = generateIv();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    utf8(plaintext) as BufferSource,
  );
  return {
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
  };
}

/** Rejects if the key is wrong or the data was tampered with. */
export async function decrypt(
  key: CryptoKey,
  data: Encrypted,
): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(data.iv) as BufferSource },
    key,
    fromBase64(data.ciphertext) as BufferSource,
  );
  return textDecoder.decode(plaintext);
}
