import type { QueryResult } from "pg";

import { type Supplier, ensureSupplierName } from "../../domain/entities/supplier.js";
import type { SupplierRepository } from "../../application/ports/supplier-repository.js";
import { getPostgresPool } from "../persistence/postgres/connection.js";

interface SupplierRow {
  id: string;
  name: string;
  document: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: Date;
  updated_at: Date;
}

const mapSupplierRow = (row: SupplierRow): Supplier => ({
  id: row.id,
  name: row.name,
  document: row.document,
  contactName: row.contact_name,
  phone: row.phone,
  email: row.email,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export class PostgresSupplierRepository implements SupplierRepository {
  private readonly pool = getPostgresPool();

  async create(supplier: Supplier): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO suppliers
        (id, name, document, contact_name, phone, email, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        supplier.id,
        ensureSupplierName(supplier.name),
        supplier.document,
        supplier.contactName,
        supplier.phone,
        supplier.email,
        supplier.createdAt,
        supplier.updatedAt
      ]
    );
  }

  async update(supplier: Supplier): Promise<void> {
    await this.pool.query(
      `
      UPDATE suppliers
      SET
        name = $2,
        document = $3,
        contact_name = $4,
        phone = $5,
        email = $6,
        updated_at = $7
      WHERE id = $1
      `,
      [
        supplier.id,
        ensureSupplierName(supplier.name),
        supplier.document,
        supplier.contactName,
        supplier.phone,
        supplier.email,
        supplier.updatedAt
      ]
    );
  }

  async findById(id: string): Promise<Supplier | null> {
    const result: QueryResult<SupplierRow> = await this.pool.query(
      `
      SELECT id, name, document, contact_name, phone, email, created_at, updated_at
      FROM suppliers
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    const row = result.rows[0];
    return row ? mapSupplierRow(row) : null;
  }

  async findByName(name: string): Promise<Supplier | null> {
    const result: QueryResult<SupplierRow> = await this.pool.query(
      `
      SELECT id, name, document, contact_name, phone, email, created_at, updated_at
      FROM suppliers
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1
      `,
      [ensureSupplierName(name)]
    );

    const row = result.rows[0];
    return row ? mapSupplierRow(row) : null;
  }

  async list(): Promise<Supplier[]> {
    const result: QueryResult<SupplierRow> = await this.pool.query(
      `
      SELECT id, name, document, contact_name, phone, email, created_at, updated_at
      FROM suppliers
      ORDER BY name ASC
      `
    );

    return result.rows.map(mapSupplierRow);
  }
}
