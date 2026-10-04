import { Prisma } from "@prisma/client";
import type { KdfParams } from "@zerovault/shared-types";
import { describe, expect, it } from "vitest";
import { EmailAlreadyRegisteredError } from "../domain/errors.js";
import type { NewUser } from "../domain/user.js";
import {
  PrismaUserRepository,
  type PrismaUserClient,
  type PrismaUserRecord,
} from "./prisma-user-repository.js";

const kdfParams: KdfParams = { iterations: 600000, hash: "SHA-256" };

const newUser: NewUser = {
  email: "a@b.com",
  authHashHash: "hh",
  authSalt: "as",
  encSalt: "es",
  kdfParams,
};

const record: PrismaUserRecord = {
  id: "u1",
  email: "a@b.com",
  authHashHash: "hh",
  authSalt: "as",
  encSalt: "es",
  kdfParams,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

function fakeClient(overrides: {
  findUnique?: PrismaUserClient["user"]["findUnique"];
  create?: PrismaUserClient["user"]["create"];
}) {
  const createCalls: unknown[] = [];
  const client: PrismaUserClient = {
    user: {
      findUnique: overrides.findUnique ?? (async () => null),
      create: async (args) => {
        createCalls.push(args);
        return (overrides.create ?? (async () => record))(args);
      },
    },
  };
  return { client, createCalls };
}

describe("PrismaUserRepository", () => {
  it("findByEmail maps a record to a StoredUser", async () => {
    const { client } = fakeClient({ findUnique: async () => record });
    expect(await new PrismaUserRepository(client).findByEmail("a@b.com")).toEqual(record);
  });

  it("findByEmail returns null when not found", async () => {
    const { client } = fakeClient({ findUnique: async () => null });
    expect(await new PrismaUserRepository(client).findByEmail("x@y.com")).toBeNull();
  });

  it("create returns a mapped StoredUser and passes only hashed data", async () => {
    const { client, createCalls } = fakeClient({});
    const stored = await new PrismaUserRepository(client).create(newUser);
    expect(stored).toEqual(record);
    expect(createCalls).toEqual([
      { data: { email: "a@b.com", authHashHash: "hh", authSalt: "as", encSalt: "es", kdfParams } },
    ]);
  });

  it("create maps P2002 to EmailAlreadyRegisteredError", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "6.19.3",
    });
    const { client } = fakeClient({ create: async () => { throw err; } });
    await expect(new PrismaUserRepository(client).create(newUser)).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
  });

  it("create rethrows unrelated errors unchanged", async () => {
    const err = new Error("boom");
    const { client } = fakeClient({ create: async () => { throw err; } });
    await expect(new PrismaUserRepository(client).create(newUser)).rejects.toBe(err);
  });
});
