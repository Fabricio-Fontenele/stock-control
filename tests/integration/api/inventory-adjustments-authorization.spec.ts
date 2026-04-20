import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app.js";
import { getPostgresPool } from "../../../src/infrastructure/persistence/postgres/connection.js";

describe("integration inventory adjustments authorization", () => {
  const app = buildApp({ logger: false });
  let productId = "";

  beforeAll(async () => {
    await app.ready();
    const pool = getPostgresPool();

    await pool.query(
      `INSERT INTO categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Integracao Ajuste", "Categoria"]
    );

    await pool.query(
      `INSERT INTO suppliers (id, name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Fornecedor Integracao Ajuste"]
    );

    productId = randomUUID();
    await pool.query(
      `INSERT INTO products (
         id, sku, name, category_id, supplier_id, purchase_price, sale_price,
         unit_of_measure, minimum_stock, tracks_expiration, status, created_at, updated_at
       ) VALUES ($1, $2, $3,
         (SELECT id FROM categories WHERE name = 'Integracao Ajuste' LIMIT 1),
         (SELECT id FROM suppliers WHERE name = 'Fornecedor Integracao Ajuste' LIMIT 1),
         1, 2, 'un', 1, false, 'active', NOW(), NOW())
       ON CONFLICT (sku) DO NOTHING`,
      [productId, "SKU-ADJ-INT-1", "Produto Ajuste Integracao"]
    );

    const persisted = await pool.query<{ id: string }>(
      "SELECT id FROM products WHERE sku = $1 LIMIT 1",
      ["SKU-ADJ-INT-1"]
    );
    productId = persisted.rows[0]?.id ?? productId;
  });

  afterAll(async () => {
    await app.close();
  });

  it("allows admin inventory adjustment", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

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
        quantity: 2,
        reason: "Ajuste autorizado"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().reasonType).toBe("inventory-adjustment");
  });
});
