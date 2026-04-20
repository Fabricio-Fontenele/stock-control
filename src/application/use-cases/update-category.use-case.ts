import { ensureCategoryName, type Category } from "../../domain/entities/category.js";
import { HttpError } from "../errors/http-error.js";
import type { UpdateCategoryInput } from "../dto/category-supplier-dto.js";
import type { CategoryRepository } from "../ports/category-repository.js";

interface UpdateCategoryDependencies {
  categoryRepository: CategoryRepository;
}

export class UpdateCategoryUseCase {
  constructor(private readonly deps: UpdateCategoryDependencies) {}

  async execute(input: UpdateCategoryInput): Promise<Category> {
    const existing = await this.deps.categoryRepository.findById(input.categoryId);

    if (!existing) {
      throw new HttpError(404, "Category not found");
    }

    const name = input.name ? ensureCategoryName(input.name) : existing.name;
    const owner = await this.deps.categoryRepository.findByName(name);

    if (owner && owner.id !== existing.id) {
      throw new HttpError(409, "Category name is already reserved");
    }

    const updated: Category = {
      ...existing,
      name,
      description: input.description === undefined ? existing.description : input.description?.trim() || null,
      updatedAt: new Date()
    };

    await this.deps.categoryRepository.update(updated);
    return updated;
  }
}
