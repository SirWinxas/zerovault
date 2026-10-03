import { describe, expect, it } from "vitest";
import {
  DEFAULT_KDF_PARAMS,
  decrypt,
  deriveAuthHash,
  deriveEncryptionKey,
  encrypt,
  fromBase64,
  generateIv,
  generateSalt,
  toBase64,
  type KdfParams,
} from "./index";

// Low iteration count keeps the suite fast; production default is tested separately.
const FAST: KdfParams = { iterations: 1000, hash: "SHA-256" };

describe("helpers", () => {
  it("exposes the production KDF defaults", () => {
    expect(DEFAULT_KDF_PARAMS).toEqual({ iterations: 600000, hash: "SHA-256" });
  });

  it("generateSalt defaults to 16 random bytes and honors a custom length", () => {
    expect(generateSalt()).toHaveLength(16);
    expect(generateSalt(32)).toHaveLength(32);
    expect(toBase64(generateSalt())).not.toBe(toBase64(generateSalt()));
  });

  it("generateIv returns 12 random bytes", () => {
    expect(generateIv()).toHaveLength(12);
    expect(toBase64(generateIv())).not.toBe(toBase64(generateIv()));
  });

  it("base64 round-trips arbitrary bytes", () => {
    const bytes = new Uint8Array(256).map((_, i) => i);
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
    expect(toBase64(new Uint8Array([104, 105]))).toBe("aGk=");
  });
});

describe("encrypt / decrypt", () => {
  it("decrypts to the original plaintext (including unicode)", async () => {
    const salt = generateSalt();
    const key = await deriveEncryptionKey("correct horse", salt, FAST);
    const plaintext = "s3cr3t \u{1F510} contraseña";
    const data = await encrypt(key, plaintext);
    expect(await decrypt(key, data)).toBe(plaintext);
  });

  it("rejects decryption with a key from a different password (same salt)", async () => {
    const salt = generateSalt();
    const good = await deriveEncryptionKey("right", salt, FAST);
    const bad = await deriveEncryptionKey("wrong", salt, FAST);
    const data = await encrypt(good, "secret");
    await expect(decrypt(bad, data)).rejects.toThrow();
  });

  it("rejects tampered ciphertext (GCM authentication)", async () => {
    const key = await deriveEncryptionKey("pw", generateSalt(), FAST);
    const data = await encrypt(key, "secret");
    const bytes = fromBase64(data.ciphertext);
    bytes[0] ^= 0xff;
    await expect(
      decrypt(key, { ...data, ciphertext: toBase64(bytes) }),
    ).rejects.toThrow();
  });

  it("uses a fresh IV per call: same plaintext yields different ciphertexts", async () => {
    const key = await deriveEncryptionKey("pw", generateSalt(), FAST);
    const a = await encrypt(key, "same");
    const b = await encrypt(key, "same");
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
    expect(fromBase64(a.iv)).toHaveLength(12);
    expect(await decrypt(key, a)).toBe("same");
    expect(await decrypt(key, b)).toBe("same");
  });

  it("two keys derived from the same (password, salt) decrypt each other's data", async () => {
    const salt = generateSalt();
    const k1 = await deriveEncryptionKey("pw", salt, FAST);
    const k2 = await deriveEncryptionKey("pw", salt, FAST);
    expect(await decrypt(k2, await encrypt(k1, "hello"))).toBe("hello");
  });
});

describe("deriveEncryptionKey", () => {
  it("returns a non-extractable AES-GCM key that cannot be exported", async () => {
    const key = await deriveEncryptionKey("pw", generateSalt(), FAST);
    expect(key.extractable).toBe(false);
    expect(key.algorithm).toMatchObject({ name: "AES-GCM", length: 256 });
    expect([...key.usages].sort()).toEqual(["decrypt", "encrypt"]);
    await expect(crypto.subtle.exportKey("raw", key)).rejects.toThrow();
  });
});

describe("deriveAuthHash", () => {
  it("is deterministic for the same (password, salt, params)", async () => {
    const salt = generateSalt();
    const a = await deriveAuthHash("pw", salt, FAST);
    const b = await deriveAuthHash("pw", salt, FAST);
    expect(a).toBe(b);
    expect(fromBase64(a)).toHaveLength(32);
  });

  it("differs for a different salt", async () => {
    const a = await deriveAuthHash("pw", generateSalt(), FAST);
    const b = await deriveAuthHash("pw", generateSalt(), FAST);
    expect(a).not.toBe(b);
  });

  it("differs for a different password", async () => {
    const salt = generateSalt();
    expect(await deriveAuthHash("pw1", salt, FAST)).not.toBe(
      await deriveAuthHash("pw2", salt, FAST),
    );
  });

  it("differs for different iteration counts", async () => {
    const salt = generateSalt();
    expect(await deriveAuthHash("pw", salt, FAST)).not.toBe(
      await deriveAuthHash("pw", salt, { ...FAST, iterations: 1001 }),
    );
  });

  it("uses the default params when none are given", async () => {
    const salt = generateSalt();
    expect(await deriveAuthHash("pw", salt)).toBe(
      await deriveAuthHash("pw", salt, DEFAULT_KDF_PARAMS),
    );
  });
});
