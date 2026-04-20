import type { QueryResult } from "pg";

import {
  PRODUCT_STATUS,
  type Product,
  ensureProductMinimumStock,
  ensureProductSku
} from "../../domain/entities/product.js";
import type { ProductFilter, ProductRepository } from "../../application/ports/product-repository.js";
import { getPostgresPool } from "../persistence/postgres/connection.js";

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  supplier_id: string;
  purchase_price: string;
  sale_price: string;
  unit_of_measure: string;
  minimum_stock: string;
  tracks_expiration: boolean;
  status: "active" | "inactive";
  created_at: Date;
  updated_at: Date;
}

const mapProductRow = (row: ProductRow): Product => ({
  id: row.id,
  sku: row.sku,
  name: row.name,
  categoryId: row.category_id,
  supplierId: row.supplier_id,
  purchasePrice: Number(row.purchase_price),
  salePrice: Number(row.sale_price),
  unitOfMeasure: row.unit_of_measure,
  minimumStock: Number(row.minimum_stock),
  tracksExpiration: row.tracks_expiration,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export class PostgresProductRepository implements ProductRepository {
  private readonly pool = getPostgresPool();

  async create(product: Product): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO products (
        id,
        sku,
        name,
        category_id,
        supplier_id,
        purchase_price,
        sale_price,
        unit_of_measure,
        minimum_stock,
        tracks_expiration,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `,
      [
        product.id,
        ensureProductSku(product.sku),
        product.name,
        product.categoryId,
        product.supplierId,
        product.purchasePrice,
        product.salePrice,
        product.unitOfMeasure,
        ensureProductMinimumStock(product.minimumStock),
        product.tracksExpiration,
        product.status,
        product.createdAt,
        product.updatedAt
      ]
    );
  }

  async update(product: Product): Promise<void> {
    await this.pool.query(
      `
      UPDATE products
      SET
        name = $2,
        category_id = $3,
        supplier_id = $4,
        purchase_price = $5,
        sale_price = $6,
        unit_of_measure = $7,
        minimum_stock = $8,
        tracks_expiration = $9,
        status = $10,
        updated_at = $11
      WHERE id = $1
      `,
      [
        product.id,
        product.name,
        product.categoryId,
        product.supplierId,
        product.purchasePrice,
        product.salePrice,
        product.unitOfMeasure,
        ensureProductMinimumStock(product.minimumStock),
        product.tracksExpiration,
        product.status,
        product.updatedAt
      ]
    );
  }

  async findById(id: string): Promise<Product | null> {
    const result: QueryResult<ProductRow> = await this.pool.query(
      `
      SELECT
        id,
        sku,
        name,
        category_id,
        supplier_id,
        purchase_price,
        sale_price,
        unit_of_measure,
        minimum_stock,
        tracks_expiration,
        status,
        created_at,
        updated_at
      FROM products
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    const row = result.rows[0];
    return row ? mapProductRow(row) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const result: QueryResult<ProductRow> = await this.pool.query(
      `
      SELECT
        id,
        sku,
        name,
        category_id,
        supplier_id,
        purchase_price,
        sale_price,
        unit_of_measure,
        minimum_stock,
        tracks_expiration,
        status,
        created_at,
        updated_at
      FROM products
      WHERE sku = $1
      LIMIT 1
      `,
      [ensureProductSku(sku)]
    );

    const row = result.rows[0];
    return row ? mapProductRow(row) : null;
  }

  async list(filter?: ProductFilter): Promise<Product[]> {
    const values: unknown[] = [];
    const whereClauses: string[] = [];

    if (filter?.query) {
      values.push(`%${filter.query.trim()}%`);
      whereClauses.push(`(name ILIKE $${values.length} OR sku ILIKE $${values.length})`);
    }

    if (filter?.isActive !== undefined) {
      values.push(filter.isActive ? PRODUCT_STATUS.ACTIVE : PRODUCT_STATUS.INACTIVE);
      whereClauses.push(`status = $${values.length}`);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const result: QueryResult<ProductRow> = await this.pool.query(
      `
      SELECT
        id,
        sku,
        name,
        category_id,
        supplier_id,
        purchase_price,
        sale_price,
        unit_of_measure,
        minimum_stock,
        tracks_expiration,
        status,
        created_at,
        updated_at
      FROM products
      ${whereSql}
      ORDER BY name ASC
      `,
      values
    );

    return result.rows.map(mapProductRow);
  }
}
