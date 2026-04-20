import bcrypt from "bcrypt";

import type { PasswordHasherPort } from "../../application/ports/password-hasher.js";

const SALT_ROUNDS = 10;

export interface PasswordHasher {
  hash(rawPassword: string): Promise<string>;
  compare(rawPassword: string, hashedPassword: string): Promise<boolean>;
}

export class BcryptPasswordHasher implements PasswordHasher, PasswordHasherPort {
  async hash(rawPassword: string): Promise<string> {
    if (!rawPassword || rawPassword.length < 6) {
      throw new Error("Password must have at least 6 characters");
    }

    return bcrypt.hash(rawPassword, SALT_ROUNDS);
  }

  async compare(rawPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(rawPassword, hashedPassword);
  }
}
