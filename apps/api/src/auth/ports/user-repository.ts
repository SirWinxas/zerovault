import type { NewUser, StoredUser } from "../domain/user.js";

export interface UserRepository {
  findByEmail(email: string): Promise<StoredUser | null>;
  create(user: NewUser): Promise<StoredUser>;
}
