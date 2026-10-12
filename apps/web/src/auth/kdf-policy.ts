import {
  KDF_MAX_ITERATIONS,
  KDF_MIN_ITERATIONS,
  type KdfParams,
} from "@zerovault/shared-types";

/**
 * Client-side KDF policy. The server is untrusted: refuse to derive keys with
 * params outside the policy (e.g. a downgrade to `iterations: 1`, or an
 * excessive count used to freeze the tab). Throws before any derivation.
 */
export function assertKdfPolicy(params: KdfParams): void {
  const ok =
    typeof params === "object" &&
    params !== null &&
    Number.isInteger(params.iterations) &&
    params.iterations >= KDF_MIN_ITERATIONS &&
    params.iterations <= KDF_MAX_ITERATIONS &&
    params.hash === "SHA-256";
  if (!ok) throw new Error("Unsafe key derivation parameters");
}
