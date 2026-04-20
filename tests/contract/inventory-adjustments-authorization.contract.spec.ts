import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { getPostgresPool } from "../../src/infrastructure/persistence/postgres/connection.js";
import { BcryptPasswordHasher } from "../../src/infrastructure/security/password-hasher.js";

describe("contract /inventory/adjustments authorization", () => {
  const app = buildApp({ logger: false });
  let productId = "";

  beforeAll(async () => {
    await app.ready();
    const pool = getPostgresPool();

    await pool.query(
      `INSERT INTO categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Ajustes", "Categoria ajustes"]
    );

    await pool.query(
      `INSERT INTO suppliers (id, name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Fornecedor Ajustes"]
    );

    productId = randomUUID();
    await pool.query(
      `INSERT INTO products (
         id, sku, name, category_id, supplier_id, purchase_price, sale_price,
         unit_of_measure, minimum_stock, tracks_expiration, status, created_at, updated_at
       ) VALUES ($1, $2, $3,
         (SELECT id FROM categories WHERE name = 'Ajustes' LIMIT 1),
         (SELECT id FROM suppliers WHERE name = 'Fornecedor Ajustes' LIMIT 1),
         1, 2, 'un', 1, false, 'active', NOW(), NOW())
       ON CONFLICT (sku) DO NOTHING`,
      [productId, "SKU-ADJ-AUTH-1", "Produto Ajuste Auth"]
    );

    const persisted = await pool.query<{ id: string }>(
      "SELECT id FROM products WHERE sku = $1 LIMIT 1",
      ["SKU-ADJ-AUTH-1"]
    );
    productId = persisted.rows[0]?.id ?? productId;

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

  it("blocks employee from posting inventory adjustment", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "employee@conveniencia.local",
        password: "employee123"
      }
    });

    expect(login.statusCode).toBe(200);
    const { accessToken } = login.json();

    const response = await app.inject({
      method: "POST",
      url: "/inventory/adjustments",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        productId,
        direction: "entrada",
        quantity: 1,
        reason: "Ajuste de teste"
      }
    });

    expect(response.statusCode).toBe(403);
  });
});
