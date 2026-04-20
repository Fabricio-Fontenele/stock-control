import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { getPostgresPool } from "../../src/infrastructure/persistence/postgres/connection.js";
import { randomUUID } from "node:crypto";

describe("contract /inventory/adjustments", () => {
  const app = buildApp({ logger: false });
  let productId = "";

  beforeAll(async () => {
    await app.ready();
    const pool = getPostgresPool();

    await pool.query(
      `INSERT INTO categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Contrato Ajustes", "Categoria contrato ajustes"]
    );

    await pool.query(
      `INSERT INTO suppliers (id, name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Fornecedor Contrato Ajustes"]
    );

    productId = randomUUID();
    await pool.query(
      `INSERT INTO products (
         id, sku, name, category_id, supplier_id, purchase_price, sale_price,
         unit_of_measure, minimum_stock, tracks_expiration, status, created_at, updated_at
       ) VALUES ($1, $2, $3,
         (SELECT id FROM categories WHERE name = 'Contrato Ajustes' LIMIT 1),
         (SELECT id FROM suppliers WHERE name = 'Fornecedor Contrato Ajustes' LIMIT 1),
         1, 2, 'un', 1, false, 'active', NOW(), NOW())
       ON CONFLICT (sku) DO NOTHING`,
      [productId, "SKU-ADJ-CONTRACT-1", "Produto Ajuste Contrato"]
    );

    const persisted = await pool.query<{ id: string }>(
      "SELECT id FROM products WHERE sku = $1 LIMIT 1",
      ["SKU-ADJ-CONTRACT-1"]
    );

    productId = persisted.rows[0]?.id ?? productId;
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 400 when adjustment reason is missing", async () => {
    const adminLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const token = adminLogin.json().accessToken;

    const response = await app.inject({
      method: "POST",
      url: "/inventory/adjustments",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        productId,
        direction: "entrada",
        quantity: 1,
        reason: ""
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 when direction is invalid", async () => {
    const adminLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const token = adminLogin.json().accessToken;

    const response = await app.inject({
      method: "POST",
      url: "/inventory/adjustments",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        productId,
        direction: "invalid",
        quantity: 1,
        reason: "Ajuste invalido"
      }
    });

    expect(response.statusCode).toBe(400);
  });
});
