import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { buildApp } from "../../src/app.js";
import { getPostgresPool } from "../../src/infrastructure/persistence/postgres/connection.js";

describe("contract /products", () => {
  const app = buildApp({ logger: false });

  beforeAll(async () => {
    await app.ready();

    const pool = getPostgresPool();
    await pool.query(
      `INSERT INTO categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Contrato Produtos", "Categoria contrato"]
    );

    await pool.query(
      `INSERT INTO suppliers (id, name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Fornecedor Contrato Produtos"]
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates and lists products for admin", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const token = login.json().accessToken;

    const createResponse = await app.inject({
      method: "POST",
      url: "/products",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        sku: `SKU-CONTRACT-${randomUUID()}`,
        name: "Produto Contrato",
        categoryId: (
          await getPostgresPool().query(
            "SELECT id FROM categories WHERE name = 'Contrato Produtos' LIMIT 1"
          )
        ).rows[0]?.id,
        supplierId: (
          await getPostgresPool().query(
            "SELECT id FROM suppliers WHERE name = 'Fornecedor Contrato Produtos' LIMIT 1"
          )
        ).rows[0]?.id,
        purchasePrice: 2,
        salePrice: 4,
        unitOfMeasure: "un",
        minimumStock: 1,
        tracksExpiration: true
      }
    });

    expect(createResponse.statusCode).toBe(201);

    const listResponse = await app.inject({
      method: "GET",
      url: "/products?status=active",
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(listResponse.statusCode).toBe(200);
    expect(Array.isArray(listResponse.json().items)).toBe(true);
  });
});
