import { type User } from "../../domain/entities/user.js";

export interface UserRepository {
  create(user: User): Promise<void>;
  update(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(): Promise<User[]>;
  delete(id: string): Promise<void>;
}
