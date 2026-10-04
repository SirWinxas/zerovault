import { randomUUID } from "node:crypto";
import type { NewUser, StoredUser } from "../domain/user.js";
import type { UserRepository } from "../ports/user-repository.js";

/** Test double: not for production use. */
export class InMemoryUserRepository implements UserRepository {
  private readonly byEmail = new Map<string, StoredUser>();

  async findByEmail(email: string): Promise<StoredUser | null> {
    return this.byEmail.get(email) ?? null;
  }

  async create(user: NewUser): Promise<StoredUser> {
    const stored: StoredUser = { ...user, id: randomUUID(), createdAt: new Date() };
    this.byEmail.set(user.email, stored);
    return stored;
  }
}
