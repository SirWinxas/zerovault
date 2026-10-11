/** Canonical form of an account email: case- and surrounding-whitespace-insensitive. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
