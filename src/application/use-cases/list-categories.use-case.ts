import type { Category } from "../../domain/entities/category.js";
import type { CategoryRepository } from "../ports/category-repository.js";

interface ListCategoriesDependencies {
  categoryRepository: CategoryRepository;
}

export class ListCategoriesUseCase {
  constructor(private readonly deps: ListCategoriesDependencies) {}

  async execute(): Promise<Category[]> {
    return this.deps.categoryRepository.list();
  }
}
