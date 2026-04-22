import type { UserRepository } from "../ports/user-repository.js";
import type { User } from "../../domain/entities/user.js";
import { HttpError } from "../errors/http-error.js";
import type { PasswordHasherPort } from "../ports/password-hasher.js";

interface UpdateUserPasswordDependencies {
  userRepository: UserRepository;
  passwordHasher: PasswordHasherPort;
}

interface UpdateUserPasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class UpdateUserPasswordUseCase {
  constructor(private readonly deps: UpdateUserPasswordDependencies) {}

  async execute(input: UpdateUserPasswordInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);

    if (!user) {
      throw new HttpError(404, "Usuario nao encontrado");
    }

    const isValid = await this.deps.passwordHasher.compare(
      input.currentPassword,
      user.passwordHash
    );

    if (!isValid) {
      throw new HttpError(401, "Senha atual incorreta");
    }

    const newPasswordHash = await this.deps.passwordHasher.hash(input.newPassword);

    await this.deps.userRepository.update({
      ...user,
      passwordHash: newPasswordHash,
      updatedAt: new Date()
    });
  }
}