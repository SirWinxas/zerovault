import type { RegisterRequest } from "@zerovault/shared-types";
import { EmailAlreadyRegisteredError } from "../domain/errors.js";
import type { Hasher } from "../ports/hasher.js";
import type { UserRepository } from "../ports/user-repository.js";

export interface RegisterUserDeps {
  users: UserRepository;
  hasher: Hasher;
}

export function makeRegisterUser({ users, hasher }: RegisterUserDeps) {
  return async function registerUser(input: RegisterRequest): Promise<{ id: string }> {
    if (await users.findByEmail(input.email)) {
      throw new EmailAlreadyRegisteredError();
    }

    // The client-derived authHash is a password-equivalent secret: the server
    // only ever persists a salted hash of it, never the value itself.
    const authHashHash = await hasher.hash(input.authHash);

    const { id } = await users.create({
      email: input.email,
      authHashHash,
      authSalt: input.authSalt,
      encSalt: input.encSalt,
      kdfParams: input.kdfParams,
    });
    return { id };
  };
}
