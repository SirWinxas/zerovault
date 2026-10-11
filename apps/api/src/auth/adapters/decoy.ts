import { createHmac, randomBytes, scryptSync } from "node:crypto";
import { KDF_MIN_ITERATIONS, type KdfParams } from "@zerovault/shared-types";
import { normalizeEmail } from "../domain/email.js";

const SALT_BYTES = 16;
const KEY_BYTES = 64;

/**
 * Default client KDF params (inside the shared KDF policy); decoy responses must
 * be indistinguishable from real ones.
 */
const DEFAULT_KDF_PARAMS: KdfParams = { iterations: KDF_MIN_ITERATIONS, hash: "SHA-256" };

export interface Decoy {
  /** Deterministic per-email base64 salt, unpredictable without the pepper. */
  saltFor(email: string): string;
  kdfParams: KdfParams;
  /** A valid ScryptHasher-format stored hash, for timing parity on unknown emails. */
  hash: string;
}

export function createDecoy(pepper: string): Decoy {
  const salt = randomBytes(SALT_BYTES);
  const key = scryptSync(pepper, salt, KEY_BYTES);

  return {
    saltFor: (email) =>
      createHmac("sha256", pepper).update(normalizeEmail(email)).digest().subarray(0, SALT_BYTES).toString("base64"),
    kdfParams: DEFAULT_KDF_PARAMS,
    hash: `${salt.toString("hex")}:${key.toString("hex")}`,
  };
}
