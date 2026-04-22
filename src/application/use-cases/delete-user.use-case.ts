import type { UserRepository } from "../ports/user-repository.js";
import type { User } from "../../domain/entities/user.js";
import { HttpError } from "../errors/http-error.js";

interface DeleteUserDependencies {
  userRepository: UserRepository;
}

export class DeleteUserUseCase {
  constructor(private readonly deps: DeleteUserDependencies) {}

  async execute(userId: string, currentUserId: string): Promise<void> {
    if (userId === currentUserId) {
      throw new HttpError(400, "Nao e possivel excluir a propria conta");
    }

    const exists = await this.deps.userRepository.findById(userId);

    if (!exists) {
      throw new HttpError(404, "Usuario nao encontrado");
    }

    if (exists.role === "admin") {
      throw new HttpError(403, "Nao e possivel excluir administradores");
    }

    await this.deps.userRepository.delete(userId);
  }
}