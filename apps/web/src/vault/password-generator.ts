export interface PasswordOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
};

const SETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
} as const;

/** Uniform integer in [0, max) via rejection sampling (no modulo bias). */
function randomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

function pick(chars: string): string {
  return chars[randomInt(chars.length)];
}

/**
 * Generates a random password with a CSPRNG. Guarantees at least one
 * character from every enabled set.
 */
export function generatePassword(opts: Partial<PasswordOptions> = {}): string {
  const o: PasswordOptions = { ...DEFAULT_PASSWORD_OPTIONS, ...opts };
  const enabled = (Object.keys(SETS) as (keyof typeof SETS)[])
    .filter((k) => o[k])
    .map((k) => SETS[k]);

  if (enabled.length === 0) {
    throw new Error("Enable at least one character set");
  }
  if (!Number.isInteger(o.length) || o.length < enabled.length) {
    throw new Error(
      `Invalid length: must be an integer of at least ${enabled.length}`,
    );
  }

  const combined = enabled.join("");
  const chars = enabled.map(pick);
  while (chars.length < o.length) chars.push(pick(combined));

  // Fisher-Yates shuffle with CSPRNG so seeded chars are not positionally biased.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
