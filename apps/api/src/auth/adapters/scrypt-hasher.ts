import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Hasher } from "../ports/hasher.js";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_BYTES = 64;
const HEX = /^[0-9a-f]+$/i;

export class ScryptHasher implements Hasher {
  async hash(value: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const derived = await scryptAsync(value, salt, KEY_BYTES);
    return `${salt.toString("hex")}:${derived.toString("hex")}`;
  }

  async verify(value: string, stored: string): Promise<boolean> {
    const parts = stored.split(":");
    if (parts.length !== 2) return false;
    const [saltHex, hashHex] = parts as [string, string];
    if (!HEX.test(saltHex) || !HEX.test(hashHex)) return false;
    if (saltHex.length % 2 !== 0 || hashHex.length % 2 !== 0) return false;

    const expected = Buffer.from(hashHex, "hex");
    if (expected.length !== KEY_BYTES) return false;

    const actual = await scryptAsync(value, Buffer.from(saltHex, "hex"), KEY_BYTES);
    return timingSafeEqual(actual, expected);
  }
}
