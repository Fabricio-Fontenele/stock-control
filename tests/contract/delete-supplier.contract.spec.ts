import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { buildApp } from "../../src/app.js";
import { getPostgresPool } from "../../src/infrastructure/persistence/postgres/connection.js";

describe("DELETE /suppliers/:id", () => {
  const app = buildApp({ logger: false });
  let deletableSupplierId = "";
  let linkedSupplierId = "";
  let token = "";

  beforeAll(async () => {
    await app.ready();
    const loginResponse = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@conveniencia.local", password: "admin123" }
    });
    token = loginResponse.json().accessToken;

    const createResponse = await app.inject({
      method: "POST",
      url: "/suppliers",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: `Test Delete ${randomUUID()}` }
    });
    deletableSupplierId = createResponse.json().id;

    const linkedSupplierResponse = await app.inject({
      method: "POST",
      url: "/suppliers",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: `Test Delete Linked ${randomUUID()}` }
    });
    linkedSupplierId = linkedSupplierResponse.json().id;

    const categoryId = randomUUID();
    const productId = randomUUID();
    await getPostgresPool().query(
      `INSERT INTO categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [categoryId, `Categoria Supplier Delete ${randomUUID()}`, "Contrato delete"]
    );
    await getPostgresPool().query(
      `INSERT INTO products (
         id, sku, name, category_id, supplier_id, purchase_price, sale_price,
         unit_of_measure, minimum_stock, tracks_expiration, status, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, 1, 2, 'un', 1, false, 'active', NOW(), NOW())`,
      [productId, `SKU-DEL-SUP-${randomUUID()}`, "Produto fornecedor vinculado", categoryId, linkedSupplierId]
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it("deletes supplier and returns 204", async () => {
    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/suppliers/${deletableSupplierId}`,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(deleteResponse.statusCode).toBe(204);
  });

  it("returns 409 when supplier is linked to products", async () => {
    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/suppliers/${linkedSupplierId}`,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(deleteResponse.statusCode).toBe(409);
    expect(deleteResponse.json().message).toContain("vinculado a produtos");
  });
});
