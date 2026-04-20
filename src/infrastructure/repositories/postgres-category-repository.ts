import type { QueryResult } from "pg";

import { type Category, ensureCategoryName } from "../../domain/entities/category.js";
import type { CategoryRepository } from "../../application/ports/category-repository.js";
import { getPostgresPool } from "../persistence/postgres/connection.js";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

const mapCategoryRow = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export class PostgresCategoryRepository implements CategoryRepository {
  private readonly pool = getPostgresPool();

  async create(category: Category): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO categories (id, name, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [category.id, ensureCategoryName(category.name), category.description, category.createdAt, category.updatedAt]
    );
  }

  async update(category: Category): Promise<void> {
    await this.pool.query(
      `
      UPDATE categories
      SET name = $2, description = $3, updated_at = $4
      WHERE id = $1
      `,
      [category.id, ensureCategoryName(category.name), category.description, category.updatedAt]
    );
  }

  async findById(id: string): Promise<Category | null> {
    const result: QueryResult<CategoryRow> = await this.pool.query(
      `
      SELECT id, name, description, created_at, updated_at
      FROM categories
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    const row = result.rows[0];
    return row ? mapCategoryRow(row) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const result: QueryResult<CategoryRow> = await this.pool.query(
      `
      SELECT id, name, description, created_at, updated_at
      FROM categories
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1
      `,
      [ensureCategoryName(name)]
    );

    const row = result.rows[0];
    return row ? mapCategoryRow(row) : null;
  }

  async list(): Promise<Category[]> {
    const result: QueryResult<CategoryRow> = await this.pool.query(
      `
      SELECT id, name, description, created_at, updated_at
      FROM categories
      ORDER BY name ASC
      `
    );

    return result.rows.map(mapCategoryRow);
  }
}
