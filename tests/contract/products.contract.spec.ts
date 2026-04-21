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
        name: "Produto Contrato",
        categoryId: (
          await getPostgresPool().query(
            "SELECT id FROM categories WHERE name = 'Contrato Produtos' LIMIT 1"
          )
        ).rows[0]?.id,
        supplierId: null,
        purchasePrice: 2,
        salePrice: 4,
        unitOfMeasure: "un",
        minimumStock: 1,
        tracksExpiration: true
      }
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json().sku).toMatch(/^\d{6}$/);

    const nextSkuResponse = await app.inject({
      method: "GET",
      url: "/products/next-sku",
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(nextSkuResponse.statusCode).toBe(200);
    expect(nextSkuResponse.json().sku).toMatch(/^\d{6}$/);

    const repeatedNextSkuResponse = await app.inject({
      method: "GET",
      url: "/products/next-sku",
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(repeatedNextSkuResponse.statusCode).toBe(200);
    expect(repeatedNextSkuResponse.json().sku).toBe(nextSkuResponse.json().sku);

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

  it("accepts a custom SKU on product creation", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const token = login.json().accessToken;
    const customSku = "987654";

    const createResponse = await app.inject({
      method: "POST",
      url: "/products",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        sku: customSku,
        name: "Produto SKU Manual",
        categoryId: (
          await getPostgresPool().query(
            "SELECT id FROM categories WHERE name = 'Contrato Produtos' LIMIT 1"
          )
        ).rows[0]?.id,
        supplierId: null,
        purchasePrice: 2,
        salePrice: 5,
        unitOfMeasure: "un",
        minimumStock: 1,
        tracksExpiration: false
      }
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json().sku).toBe(customSku);
  });

  it("deactivates and reactivates a product for admin", async () => {
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
        name: "Produto Reativavel",
        categoryId: (
          await getPostgresPool().query(
            "SELECT id FROM categories WHERE name = 'Contrato Produtos' LIMIT 1"
          )
        ).rows[0]?.id,
        supplierId: null,
        purchasePrice: 3,
        salePrice: 6,
        unitOfMeasure: "un",
        minimumStock: 1,
        tracksExpiration: false
      }
    });

    expect(createResponse.statusCode).toBe(201);

    const productId = createResponse.json().id as string;

    const deactivateResponse = await app.inject({
      method: "POST",
      url: `/products/${productId}/deactivate`,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(deactivateResponse.statusCode).toBe(200);
    expect(deactivateResponse.json().status).toBe("inactive");

    const reactivateResponse = await app.inject({
      method: "POST",
      url: `/products/${productId}/reactivate`,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(reactivateResponse.statusCode).toBe(200);
    expect(reactivateResponse.json().status).toBe("active");
  });
});
