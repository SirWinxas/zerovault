import type { DecryptedVaultItem } from "./vault-entry";

// Pure client-side analysis. Only booleans and counts leave this module:
// passwords are never returned, logged, or stored.

export interface HealthItem {
  id: string;
  site: string;
  username: string;
  weak: boolean;
  reused: boolean;
}

export interface HealthSummary {
  total: number;
  weak: number;
  reused: number;
  okay: number;
  unreadable: number;
}

const MIN_LENGTH = 12;
const MIN_CLASSES = 3;

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "passw0rd", "123456", "1234567",
  "12345678", "123456789", "1234567890", "12345", "1234", "111111", "000000",
  "123123", "654321", "666666", "121212", "112233", "qwerty", "qwerty123",
  "qwertyuiop", "qazwsx", "1q2w3e4r", "1qaz2wsx", "abc123", "abcd1234",
  "letmein", "welcome", "welcome1", "admin", "admin123", "administrator",
  "root", "toor", "login", "master", "monkey", "dragon", "football",
  "baseball", "iloveyou", "sunshine", "princess", "shadow", "superman",
  "batman", "trustno1", "access", "hello", "freedom", "whatever", "changeme",
  "default", "secret", "test", "test123", "guest", "starwars", "michael",
  "jordan", "hunter2", "zaq12wsx", "mustang", "passw0rd1", "p@ssw0rd",
  "p@ssword", "letmein1", "pass", "pass123", "ninja", "azerty", "solo",
  "lovely", "flower", "cheese", "computer", "internet", "samsung", "google",
]);

function classCount(password: string): number {
  return [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
}

export function isWeak(password: string): boolean {
  return (
    password.length < MIN_LENGTH ||
    classCount(password) < MIN_CLASSES ||
    COMMON_PASSWORDS.has(password.toLowerCase())
  );
}

export function analyzeVaultHealth(items: DecryptedVaultItem[]): {
  items: HealthItem[];
  summary: HealthSummary;
} {
  const analyzable = items.filter((i) => !i.decryptError);

  const counts = new Map<string, number>();
  for (const { password } of analyzable) {
    if (password !== "") counts.set(password, (counts.get(password) ?? 0) + 1);
  }

  const result: HealthItem[] = analyzable.map(
    ({ id, site, username, password }) => ({
      id,
      site,
      username,
      weak: isWeak(password),
      reused: password !== "" && (counts.get(password) ?? 0) > 1,
    }),
  );

  const weak = result.filter((i) => i.weak).length;
  const reused = result.filter((i) => i.reused).length;
  return {
    items: result,
    summary: {
      total: result.length,
      weak,
      reused,
      okay: result.filter((i) => !i.weak && !i.reused).length,
      unreadable: items.length - analyzable.length,
    },
  };
}
