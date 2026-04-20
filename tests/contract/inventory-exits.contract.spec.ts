import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { getPostgresPool } from "../../src/infrastructure/persistence/postgres/connection.js";
import { BcryptPasswordHasher } from "../../src/infrastructure/security/password-hasher.js";

describe("contract /inventory/exits", () => {
  const app = buildApp({ logger: false });
  let productId = "";
  let sku = "";

  beforeAll(async () => {
    await app.ready();

    const pool = getPostgresPool();
    await pool.query(
      `INSERT INTO categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Doces", "Categoria teste"]
    );

    await pool.query(
      `INSERT INTO suppliers (id, name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Fornecedor Doces"]
    );

    sku = `SKU-EXIT-${randomUUID()}`;
    productId = randomUUID();

    await pool.query(
      `INSERT INTO products (
         id, sku, name, category_id, supplier_id, purchase_price, sale_price,
         unit_of_measure, minimum_stock, tracks_expiration, status, created_at, updated_at
       ) VALUES ($1, $2, $3,
         (SELECT id FROM categories WHERE name = 'Doces' LIMIT 1),
         (SELECT id FROM suppliers WHERE name = 'Fornecedor Doces' LIMIT 1),
          1, 2, 'un', 1, true, 'active', NOW(), NOW())
        ON CONFLICT (sku) DO NOTHING`,
      [productId, sku, "Produto Exit Teste"]
    );

    const persistedProduct = await pool.query<{ id: string }>(
      "SELECT id FROM products WHERE sku = $1 LIMIT 1",
      [sku]
    );
    productId = persistedProduct.rows[0]?.id ?? productId;

    await pool.query(
      `INSERT INTO stock_lots (
         id, product_id, code, received_quantity, remaining_quantity,
         entry_date, expiration_date, status, created_at, updated_at
       ) VALUES ($1, $2, $3, 20, 20, CURRENT_DATE,
         CURRENT_DATE + INTERVAL '60 days', 'available', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [randomUUID(), productId, "LOT-EXIT-1"]
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

  it.each(["sale", "loss", "expiration", "breakage"] as const)(
    "registers %s exit and returns MovementView contract shape",
    async (reasonType) => {
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
      method: "POST",
      url: "/inventory/exits",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        productId,
        quantity: 2,
        reasonType
      }
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toMatchObject({
      productId,
      movementType: "exit",
      reasonType,
      performedBy: {
        role: "admin"
      }
    });
    }
  );
});
