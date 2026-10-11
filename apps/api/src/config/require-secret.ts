/** Minimum length for JWT_SECRET and AUTH_PEPPER. */
export const MIN_SECRET_LENGTH = 32;

/**
 * Fail-fast guard for secrets read from the environment. The error names the
 * variable but never echoes its value.
 */
export function requireSecret(name: string, value: string | undefined, minLength: number): string {
  if (!value || value.length < minLength) {
    throw new Error(`${name} environment variable is required and must be at least ${minLength} characters`);
  }
  return value;
}
