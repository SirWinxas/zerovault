import { Prisma } from "@prisma/client";
import type { KdfParams } from "@zerovault/shared-types";
import { EmailAlreadyRegisteredError } from "../domain/errors.js";
import type { NewUser, StoredUser } from "../domain/user.js";
import type { UserRepository } from "../ports/user-repository.js";

export interface PrismaUserRecord {
  id: string;
  email: string;
  authHashHash: string;
  authSalt: string;
  encSalt: string;
  kdfParams: unknown;
  createdAt: Date;
}

export interface PrismaUserClient {
  user: {
    findUnique(args: { where: { email: string } }): Promise<PrismaUserRecord | null>;
    create(args: {
      data: {
        email: string;
        authHashHash: string;
        authSalt: string;
        encSalt: string;
        kdfParams: unknown;
      };
    }): Promise<PrismaUserRecord>;
  };
}

function toStoredUser(record: PrismaUserRecord): StoredUser {
  return {
    id: record.id,
    email: record.email,
    authHashHash: record.authHashHash,
    authSalt: record.authSalt,
    encSalt: record.encSalt,
    kdfParams: record.kdfParams as KdfParams,
    createdAt: record.createdAt,
  };
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaUserClient) {}

  async findByEmail(email: string): Promise<StoredUser | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? toStoredUser(record) : null;
  }

  async create(user: NewUser): Promise<StoredUser> {
    try {
      const record = await this.prisma.user.create({
        data: {
          email: user.email,
          authHashHash: user.authHashHash,
          authSalt: user.authSalt,
          encSalt: user.encSalt,
          kdfParams: user.kdfParams,
        },
      });
      return toStoredUser(record);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new EmailAlreadyRegisteredError();
      }
      throw error;
    }
  }
}
