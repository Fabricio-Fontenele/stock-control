import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app.js";
import { getPostgresPool } from "../../../src/infrastructure/persistence/postgres/connection.js";
import { BcryptPasswordHasher } from "../../../src/infrastructure/security/password-hasher.js";

describe("integration stock-entry and alerts flow", () => {
  const app = buildApp({ logger: false });
  let productId = "";

  beforeAll(async () => {
    await app.ready();

    const pool = getPostgresPool();
    await pool.query(
      `INSERT INTO categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Higiene", "Categoria integração entrada"]
    );

    await pool.query(
      `INSERT INTO suppliers (id, name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Fornecedor Higiene"]
    );

    productId = randomUUID();
    await pool.query(
      `INSERT INTO products (
         id, sku, name, category_id, supplier_id, purchase_price, sale_price,
         unit_of_measure, minimum_stock, tracks_expiration, status, created_at, updated_at
       ) VALUES ($1, $2, $3,
         (SELECT id FROM categories WHERE name = 'Higiene' LIMIT 1),
         (SELECT id FROM suppliers WHERE name = 'Fornecedor Higiene' LIMIT 1),
         2, 4, 'un', 12, true, 'active', NOW(), NOW())
       ON CONFLICT (sku) DO NOTHING`,
      [productId, "SKU-ENTRY-ALERT-1", "Produto Entrada Alertas"]
    );

    const persisted = await pool.query<{ id: string }>(
      "SELECT id FROM products WHERE sku = $1 LIMIT 1",
      ["SKU-ENTRY-ALERT-1"]
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

  it("registers an entry and exposes expiring lot on dashboard alerts", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const { accessToken } = login.json();

    const entryResponse = await app.inject({
      method: "POST",
      url: "/inventory/entries",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        productId,
        lotCode: "LOT-ENTRY-ALERT-INTEGRATION",
        quantity: 4,
        entryDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        reasonType: "supplier-purchase"
      }
    });

    expect(entryResponse.statusCode).toBe(201);
    expect(entryResponse.json().movementType).toBe("entry");

    const alertsResponse = await app.inject({
      method: "GET",
      url: "/dashboard/alerts",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    expect(alertsResponse.statusCode).toBe(200);
    const alertsBody = alertsResponse.json();
    expect(alertsBody.expiringSoon.some((item: { id: string }) => item.id === productId)).toBe(true);
    expect(alertsBody.belowMinimum.some((item: { id: string }) => item.id === productId)).toBe(false);
  });
});
