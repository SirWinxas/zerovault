import type { AuthParamsResponse } from "@zerovault/shared-types";
import { InvalidCredentialsError } from "../domain/errors.js";
import type { UserRepository } from "../ports/user-repository.js";

export interface GetAuthParamsDeps {
  users: UserRepository;
}

export function makeGetAuthParams({ users }: GetAuthParamsDeps) {
  return async function getAuthParams(email: string): Promise<AuthParamsResponse> {
    const user = await users.findByEmail(email);
    if (!user) {
      // MVP LIMITATION: this allows user enumeration (unknown emails fail,
      // known emails succeed). A future hardening step should return
      // deterministic fake params (e.g. HMAC(serverSecret, email)) for
      // unknown emails so both cases are indistinguishable.
      throw new InvalidCredentialsError();
    }
    return { authSalt: user.authSalt, kdfParams: user.kdfParams };
  };
}
