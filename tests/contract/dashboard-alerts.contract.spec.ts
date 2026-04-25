import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { getPostgresPool } from "../../src/infrastructure/persistence/postgres/connection.js";
import { BcryptPasswordHasher } from "../../src/infrastructure/security/password-hasher.js";

describe("contract /dashboard/alerts", () => {
  const app = buildApp({ logger: false });
  let belowMinimumProductId = "";

  beforeAll(async () => {
    await app.ready();
    const pool = getPostgresPool();

    const categoryName = `Padaria ${randomUUID()}`;
    const supplierName = `Fornecedor Padaria ${randomUUID()}`;

    await pool.query(
      `INSERT INTO categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [randomUUID(), categoryName, "Categoria alerta"]
    );

    await pool.query(
      `INSERT INTO suppliers (id, name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())`,
      [randomUUID(), supplierName]
    );

    const productId = randomUUID();
    const sku = `SKU-ALERT-${randomUUID()}`;
    await pool.query(
      `INSERT INTO products (
         id, sku, name, category_id, supplier_id, purchase_price, sale_price,
         unit_of_measure, minimum_stock, tracks_expiration, status, created_at, updated_at
       ) VALUES ($1, $2, $3,
         (SELECT id FROM categories WHERE name = $4 LIMIT 1),
         (SELECT id FROM suppliers WHERE name = $5 LIMIT 1),
         1, 2, 'un', 10, false, 'active', NOW(), NOW())`,
      [productId, sku, "Produto Alertas", categoryName, supplierName]
    );

    const persisted = await pool.query<{ id: string }>(
      "SELECT id FROM products WHERE sku = $1 LIMIT 1",
      [sku]
    );

    belowMinimumProductId = persisted.rows[0]?.id ?? productId;

    await pool.query(
      `INSERT INTO stock_lots (
         id, product_id, code, received_quantity, remaining_quantity,
         entry_date, expiration_date, status, created_at, updated_at
       ) VALUES ($1, $2, 'LOT-ALERT-STOCK', 3, 3, CURRENT_DATE, NULL, 'available', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [randomUUID(), belowMinimumProductId]
    );

    const employeeEmail = "employee@conveniencia.local";
    const existing = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [employeeEmail]);

    if ((existing.rowCount ?? 0) === 0) {
      const hasher = new BcryptPasswordHasher();
      const hash = await hasher.hash("employee123");

      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'employee', 'active', NOW(), NOW())`,
        [randomUUID(), "Employee User", employeeEmail, hash]
      );
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns alert collections with below-minimum stock", async () => {
    const loginResponse = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const { accessToken } = loginResponse.json();

    const response = await app.inject({
      method: "GET",
      url: "/dashboard/alerts",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(Array.isArray(body.belowMinimum)).toBe(true);
    expect(Array.isArray(body.expiringSoon)).toBe(true);
    expect(Array.isArray(body.expired)).toBe(true);
    expect(body.belowMinimum.some((item: { id: string }) => item.id === belowMinimumProductId)).toBe(true);
  });

  it("blocks employee access to dashboard alerts", async () => {
    const loginResponse = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "employee@conveniencia.local",
        password: "employee123"
      }
    });

    const { accessToken } = loginResponse.json();

    const response = await app.inject({
      method: "GET",
      url: "/dashboard/alerts",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    expect(response.statusCode).toBe(403);
  });
});
