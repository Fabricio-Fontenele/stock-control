import { randomUUID } from "node:crypto";

import { ensureCategoryName, type Category } from "../../domain/entities/category.js";
import { HttpError } from "../errors/http-error.js";
import type { CategoryRepository } from "../ports/category-repository.js";
import type { CreateCategoryInput } from "../dto/category-supplier-dto.js";

interface CreateCategoryDependencies {
  categoryRepository: CategoryRepository;
}

export class CreateCategoryUseCase {
  constructor(private readonly deps: CreateCategoryDependencies) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    const name = ensureCategoryName(input.name);
    const existing = await this.deps.categoryRepository.findByName(name);

    if (existing) {
      throw new HttpError(409, "Category name is already reserved");
    }

    const now = new Date();
    const category: Category = {
      id: randomUUID(),
      name,
      description: input.description?.trim() || null,
      createdAt: now,
      updatedAt: now
    };

    await this.deps.categoryRepository.create(category);
    return category;
  }
}
