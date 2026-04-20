import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { getPostgresPool } from "../../src/infrastructure/persistence/postgres/connection.js";
import { BcryptPasswordHasher } from "../../src/infrastructure/security/password-hasher.js";

describe("contract /dashboard/alerts", () => {
  const app = buildApp({ logger: false });

  beforeAll(async () => {
    await app.ready();
    const pool = getPostgresPool();

    await pool.query(
      `INSERT INTO categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Padaria", "Categoria alerta"]
    );

    await pool.query(
      `INSERT INTO suppliers (id, name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Fornecedor Padaria"]
    );

    const productId = randomUUID();
    await pool.query(
      `INSERT INTO products (
         id, sku, name, category_id, supplier_id, purchase_price, sale_price,
         unit_of_measure, minimum_stock, tracks_expiration, status, created_at, updated_at
       ) VALUES ($1, $2, $3,
         (SELECT id FROM categories WHERE name = 'Padaria' LIMIT 1),
         (SELECT id FROM suppliers WHERE name = 'Fornecedor Padaria' LIMIT 1),
         1, 2, 'un', 10, true, 'active', NOW(), NOW())
       ON CONFLICT (sku) DO NOTHING`,
      [productId, "SKU-ALERT-1", "Produto Alertas"]
    );

    const persisted = await pool.query<{ id: string }>(
      "SELECT id FROM products WHERE sku = $1 LIMIT 1",
      ["SKU-ALERT-1"]
    );

    const persistedId = persisted.rows[0]?.id;

    await pool.query(
      `INSERT INTO stock_lots (
         id, product_id, code, received_quantity, remaining_quantity,
         entry_date, expiration_date, status, created_at, updated_at
       ) VALUES
         ($1, $3, 'LOT-ALERT-SOON', 3, 3, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'available', NOW(), NOW()),
         ($2, $3, 'LOT-ALERT-EXPIRED', 2, 2, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '1 day', 'expired', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [randomUUID(), randomUUID(), persistedId]
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

  it("returns belowMinimum, expiringSoon and expired collections", async () => {
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
    expect(body.expiringSoon.length).toBeGreaterThan(0);
    expect(body.expired.length).toBeGreaterThan(0);
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
