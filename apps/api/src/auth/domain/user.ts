import type { KdfParams } from "@zerovault/shared-types";

export interface StoredUser {
  id: string;
  email: string;
  /** Server-side hash of the client-derived authHash; never the raw authHash value. */
  authHashHash: string;
  authSalt: string;
  encSalt: string;
  kdfParams: KdfParams;
  createdAt: Date;
}

export interface NewUser {
  email: string;
  /** Server-side hash of the client-derived authHash; never the raw authHash value. */
  authHashHash: string;
  authSalt: string;
  encSalt: string;
  kdfParams: KdfParams;
}
