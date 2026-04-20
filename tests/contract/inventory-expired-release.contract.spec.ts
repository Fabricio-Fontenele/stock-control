import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { getPostgresPool } from "../../src/infrastructure/persistence/postgres/connection.js";

describe("contract /inventory/expired-release", () => {
  const app = buildApp({ logger: false });
  let productId = "";
  let lotId = "";

  beforeAll(async () => {
    await app.ready();
    const pool = getPostgresPool();

    await pool.query(
      `INSERT INTO categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Contrato Expired Release", "Categoria"]
    );

    await pool.query(
      `INSERT INTO suppliers (id, name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Fornecedor Contrato Expired Release"]
    );

    productId = randomUUID();
    await pool.query(
      `INSERT INTO products (
         id, sku, name, category_id, supplier_id, purchase_price, sale_price,
         unit_of_measure, minimum_stock, tracks_expiration, status, created_at, updated_at
       ) VALUES ($1, $2, $3,
         (SELECT id FROM categories WHERE name = 'Contrato Expired Release' LIMIT 1),
         (SELECT id FROM suppliers WHERE name = 'Fornecedor Contrato Expired Release' LIMIT 1),
         1, 2, 'un', 1, true, 'active', NOW(), NOW())
       ON CONFLICT (sku) DO NOTHING`,
      [productId, `SKU-EXPIRED-${randomUUID()}`, "Produto Expired Release"]
    );

    lotId = randomUUID();
    await pool.query(
      `INSERT INTO stock_lots (
         id, product_id, code, received_quantity, remaining_quantity,
         entry_date, expiration_date, status, created_at, updated_at
       ) VALUES ($1, $2, $3, 5, 5, CURRENT_DATE - INTERVAL '20 days',
         CURRENT_DATE - INTERVAL '1 day', 'expired', NOW(), NOW())`,
      [lotId, productId, "LOT-EXPIRED"]
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it("approves expired release for admin", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const token = login.json().accessToken;

    const response = await app.inject({
      method: "POST",
      url: "/inventory/expired-release",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        productId,
        lotId,
        quantity: 1,
        reason: "Liberacao excepcional de contrato"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      productId,
      lotId,
      movementType: "expired-release"
    });
  });
});
