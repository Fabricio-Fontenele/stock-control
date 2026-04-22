import type { CategoryRepository } from "../ports/category-repository.js";
import type { CategoryId } from "../../domain/entities/category.js";
import { HttpError } from "../errors/http-error.js";

interface DeleteCategoryDependencies {
  categoryRepository: CategoryRepository;
}

export class DeleteCategoryUseCase {
  constructor(private readonly deps: DeleteCategoryDependencies) {}

  async execute(categoryId: CategoryId): Promise<void> {
    const exists = await this.deps.categoryRepository.findById(categoryId);

    if (!exists) {
      throw new HttpError(404, "Categoria nao encontrada");
    }

    try {
      await this.deps.categoryRepository.delete(categoryId);
    } catch (error) {
      if (error instanceof Error && error.message.includes("violates foreign key")) {
        throw new HttpError(409, "Categoria esta vinculada a produtos e nao pode ser excluida");
      }
      throw error;
    }
  }
}