import type { LoginRequest, LoginResponse } from "@zerovault/shared-types";
import { normalizeEmail } from "../domain/email.js";
import { InvalidCredentialsError } from "../domain/errors.js";
import type { Hasher } from "../ports/hasher.js";
import type { TokenService } from "../ports/token-service.js";
import type { UserRepository } from "../ports/user-repository.js";

export interface LoginUserDeps {
  users: UserRepository;
  hasher: Hasher;
  tokens: TokenService;
  decoyHash: string;
}

export function makeLoginUser({ users, hasher, tokens, decoyHash }: LoginUserDeps) {
  return async function loginUser(input: LoginRequest): Promise<LoginResponse> {
    const user = await users.findByEmail(normalizeEmail(input.email));
    if (!user) {
      // Equalize timing with the wrong-password path; result is intentionally ignored.
      await hasher.verify(input.authHash, decoyHash);
      throw new InvalidCredentialsError();
    }

    if (!(await hasher.verify(input.authHash, user.authHashHash))) {
      throw new InvalidCredentialsError();
    }

    const token = await tokens.sign({ sub: user.id });
    return { token, encSalt: user.encSalt, kdfParams: user.kdfParams };
  };
}
