import type { RegisterRequest } from "@zerovault/shared-types";
import { normalizeEmail } from "../domain/email.js";
import { EmailAlreadyRegisteredError } from "../domain/errors.js";
import type { Hasher } from "../ports/hasher.js";
import type { UserRepository } from "../ports/user-repository.js";

export interface RegisterUserDeps {
  users: UserRepository;
  hasher: Hasher;
}

/**
 * Enumeration-neutral registration: the outcome (and the expensive work) is the
 * same whether or not the email already exists, so callers cannot learn which.
 * An existing account is never modified; the caller's follow-up login simply fails.
 */
export function makeRegisterUser({ users, hasher }: RegisterUserDeps) {
  return async function registerUser(input: RegisterRequest): Promise<void> {
    const email = normalizeEmail(input.email);

    // The client-derived authHash is a password-equivalent secret: the server
    // only ever persists a salted hash of it, never the value itself. It is
    // computed on every path (timing parity) before the email is looked up.
    const authHashHash = await hasher.hash(input.authHash);

    if (await users.findByEmail(email)) return;

    try {
      await users.create({
        email,
        authHashHash,
        authSalt: input.authSalt,
        encSalt: input.encSalt,
        kdfParams: input.kdfParams,
      });
    } catch (error) {
      // Lost a concurrent-registration race: same neutral outcome as "exists".
      if (error instanceof EmailAlreadyRegisteredError) return;
      throw error;
    }
  };
}
