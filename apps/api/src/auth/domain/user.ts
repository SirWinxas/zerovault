import type { KdfParams } from "@zerovault/shared-types";

export interface StoredUser {
  id: string;
  email: string;
  authHashHash: string;
  authSalt: string;
  encSalt: string;
  kdfParams: KdfParams;
  createdAt: Date;
}

export interface NewUser {
  email: string;
  authHashHash: string;
  authSalt: string;
  encSalt: string;
  kdfParams: KdfParams;
}
