import { randomUUID } from "node:crypto";

import type { UserRepository } from "../ports/user-repository.js";
import type { UserRole } from "../../domain/entities/user.js";
import { HttpError } from "../errors/http-error.js";
import type { PasswordHasherPort } from "../ports/password-hasher.js";

interface CreateUserDependencies {
  userRepository: UserRepository;
  passwordHasher: PasswordHasherPort;
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export class CreateUserUseCase {
  constructor(private readonly deps: CreateUserDependencies) {}

  async execute(input: CreateUserInput): Promise<{ id: string; name: string; email: string; role: UserRole }> {
    const existing = await this.deps.userRepository.findByEmail(input.email);

    if (existing) {
      throw new HttpError(409, "E-mail ja cadastrado");
    }

    const passwordHash = await this.deps.passwordHasher.hash(input.password);

    const user = {
      id: randomUUID(),
      name: input.name,
      email: input.email.toLowerCase().trim(),
      passwordHash,
      role: input.role,
      status: "active" as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.deps.userRepository.create(user);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }
}