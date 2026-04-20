import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app.js";
import { getPostgresPool } from "../../../src/infrastructure/persistence/postgres/connection.js";

describe("integration admin management flow", () => {
  const app = buildApp({ logger: false });

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("manages category, supplier, product and expired release end-to-end", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const token = login.json().accessToken;

    const categoryResponse = await app.inject({
      method: "POST",
      url: "/categories",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: `Categoria Fluxo ${randomUUID()}`, description: "Fluxo admin" }
    });

    const supplierResponse = await app.inject({
      method: "POST",
      url: "/suppliers",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: `Fornecedor Fluxo ${randomUUID()}`, email: "fluxo@fornecedor.local" }
    });

    expect(categoryResponse.statusCode).toBe(201);
    expect(supplierResponse.statusCode).toBe(201);

    const categoryId = categoryResponse.json().id;
    const supplierId = supplierResponse.json().id;

    const productResponse = await app.inject({
      method: "POST",
      url: "/products",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        sku: `SKU-ADMIN-${randomUUID()}`,
        name: "Produto Fluxo Admin",
        categoryId,
        supplierId,
        purchasePrice: 2,
        salePrice: 4,
        unitOfMeasure: "un",
        minimumStock: 1,
        tracksExpiration: true
      }
    });

    expect(productResponse.statusCode).toBe(201);
    const productId = productResponse.json().id;

    const pool = getPostgresPool();
    const lotId = randomUUID();
    await pool.query(
      `INSERT INTO stock_lots (
        id, product_id, code, received_quantity, remaining_quantity,
        entry_date, expiration_date, status, created_at, updated_at
      ) VALUES ($1, $2, $3, 3, 3, CURRENT_DATE - INTERVAL '10 days',
        CURRENT_DATE - INTERVAL '1 day', 'expired', NOW(), NOW())`,
      [lotId, productId, "LOT-ADMIN-EXPIRED"]
    );

    const expiredReleaseResponse = await app.inject({
      method: "POST",
      url: "/inventory/expired-release",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        productId,
        lotId,
        quantity: 1,
        reason: "Fluxo administrativo"
      }
    });

    expect(expiredReleaseResponse.statusCode).toBe(201);
    expect(expiredReleaseResponse.json().movementType).toBe("expired-release");

    const deactivateResponse = await app.inject({
      method: "POST",
      url: `/products/${productId}/deactivate`,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(deactivateResponse.statusCode).toBe(200);
    expect(deactivateResponse.json().status).toBe("inactive");
  });
});
