import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { buildApp } from "../../src/app.js";
import { getPostgresPool } from "../../src/infrastructure/persistence/postgres/connection.js";

describe("contract /products/:productId", () => {
  const app = buildApp({ logger: false });
  let productId = "";

  beforeAll(async () => {
    await app.ready();

    const pool = getPostgresPool();
    await pool.query(
      `INSERT INTO categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Contrato Produto Detalhe", "Categoria contrato detalhe"]
    );

    await pool.query(
      `INSERT INTO suppliers (id, name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Fornecedor Contrato Produto Detalhe"]
    );

    productId = randomUUID();
    await pool.query(
      `INSERT INTO products (
        id, sku, name, category_id, supplier_id, purchase_price, sale_price,
        unit_of_measure, minimum_stock, tracks_expiration, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3,
        (SELECT id FROM categories WHERE name = 'Contrato Produto Detalhe' LIMIT 1),
        (SELECT id FROM suppliers WHERE name = 'Fornecedor Contrato Produto Detalhe' LIMIT 1),
        2, 4, 'un', 1, true, 'active', NOW(), NOW()
      )
      ON CONFLICT (sku) DO NOTHING`,
      [productId, `SKU-DETAIL-${randomUUID()}`, "Produto Detalhe Contrato"]
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns product detail and supports deactivation", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const token = login.json().accessToken;

    const detailResponse = await app.inject({
      method: "GET",
      url: `/products/${productId}`,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json()).toHaveProperty("lots");

    const patchResponse = await app.inject({
      method: "PATCH",
      url: `/products/${productId}`,
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        name: "Produto Detalhe Atualizado"
      }
    });

    expect(patchResponse.statusCode).toBe(200);
    expect(patchResponse.json().name).toBe("Produto Detalhe Atualizado");

    const deactivateResponse = await app.inject({
      method: "POST",
      url: `/products/${productId}/deactivate`,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(deactivateResponse.statusCode).toBe(200);
    expect(deactivateResponse.json().status).toBe("inactive");
  });
});
