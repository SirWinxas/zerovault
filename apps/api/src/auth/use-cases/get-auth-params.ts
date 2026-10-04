import type { AuthParamsResponse } from "@zerovault/shared-types";
import type { Decoy } from "../adapters/decoy.js";
import type { UserRepository } from "../ports/user-repository.js";

export interface GetAuthParamsDeps {
  users: UserRepository;
  decoy: Decoy;
}

export function makeGetAuthParams({ users, decoy }: GetAuthParamsDeps) {
  return async function getAuthParams(email: string): Promise<AuthParamsResponse> {
    const user = await users.findByEmail(email);
    if (user) {
      return { authSalt: user.authSalt, kdfParams: user.kdfParams };
    }
    // Unknown email: return deterministic decoy params so known and unknown
    // emails are indistinguishable (no account-enumeration oracle).
    return { authSalt: decoy.saltFor(email), kdfParams: decoy.kdfParams };
  };
}
