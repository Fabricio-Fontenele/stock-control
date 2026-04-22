import { type Category, type CategoryId } from "../../domain/entities/category.js";

export interface CategoryRepository {
  create(category: Category): Promise<void>;
  update(category: Category): Promise<void>;
  findById(id: CategoryId): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  list(): Promise<Category[]>;
  delete(id: CategoryId): Promise<void>;
}
