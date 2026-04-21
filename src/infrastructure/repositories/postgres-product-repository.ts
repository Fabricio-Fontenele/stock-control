import type { QueryResult } from "pg";

import {
  buildGeneratedProductSku,
  PRODUCT_STATUS,
  parseGeneratedProductSkuSequence,
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
  supplier_id: string | null;
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

const GENERATED_SKU_PATTERN_SQL = "^[0-9]+$";

export class PostgresProductRepository implements ProductRepository {
  private readonly pool = getPostgresPool();

  private async ensureGeneratedSkuSequenceReady(): Promise<void> {
    await this.pool.query(`CREATE SEQUENCE IF NOT EXISTS product_sku_seq START 1`);

    await this.pool.query(
      `
      SELECT setval(
        'product_sku_seq',
        GREATEST(
          (
            SELECT COALESCE(MAX(CAST(sku AS INTEGER)), 0) + 1
            FROM products
            WHERE sku ~ $1
          ),
          (
            SELECT CASE
              WHEN is_called THEN last_value + 1
              ELSE last_value
            END
            FROM product_sku_seq
          )
        ),
        false
      )
      `,
      [GENERATED_SKU_PATTERN_SQL]
    );
  }

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
        sku = $2,
        name = $3,
        category_id = $4,
        supplier_id = $5,
        purchase_price = $6,
        sale_price = $7,
        unit_of_measure = $8,
        minimum_stock = $9,
        tracks_expiration = $10,
        status = $11,
        updated_at = $12
      WHERE id = $1
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

  async nextGeneratedSku(): Promise<string> {
    await this.ensureGeneratedSkuSequenceReady();

    const result = await this.pool.query<{ sku: string }>(
      `
      SELECT LPAD(nextval('product_sku_seq')::text, 6, '0') AS sku
      `
    );

    return ensureProductSku(result.rows[0]?.sku ?? "");
  }

  async previewNextGeneratedSku(): Promise<string> {
    await this.ensureGeneratedSkuSequenceReady();

    const result = await this.pool.query<{ next_sequence: string }>(
      `
      SELECT (
        SELECT CASE
          WHEN is_called THEN last_value + 1
          ELSE last_value
        END
        FROM product_sku_seq
      )::text AS next_sequence
      `
    );

    return buildGeneratedProductSku(Number(result.rows[0]?.next_sequence ?? 0));
  }

  async syncGeneratedSkuSequence(sku: string): Promise<void> {
    await this.ensureGeneratedSkuSequenceReady();

    const sequence = parseGeneratedProductSkuSequence(sku);

    if (sequence === null) {
      return;
    }

    await this.pool.query(
      `
      SELECT setval(
        'product_sku_seq',
        GREATEST(
          (SELECT last_value FROM product_sku_seq),
          $1::bigint
        ),
        true
      )
      `,
      [sequence]
    );
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
