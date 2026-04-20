import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app.js";
import { getPostgresPool } from "../../../src/infrastructure/persistence/postgres/connection.js";
import { BcryptPasswordHasher } from "../../../src/infrastructure/security/password-hasher.js";

describe("integration quick-exit flow", () => {
  const app = buildApp({ logger: false });
  let productId = "";
  let soonLotId = "";
  let lateLotId = "";

  beforeAll(async () => {
    await app.ready();

    const pool = getPostgresPool();
    await pool.query(
      `INSERT INTO categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Snacks", "Categoria integração"]
    );

    await pool.query(
      `INSERT INTO suppliers (id, name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [randomUUID(), "Fornecedor Snacks"]
    );

    const sku = `SKU-INT-${randomUUID()}`;
    productId = randomUUID();
    await pool.query(
      `INSERT INTO products (
         id, sku, name, category_id, supplier_id, purchase_price, sale_price,
         unit_of_measure, minimum_stock, tracks_expiration, status, created_at, updated_at
       ) VALUES ($1, $2, $3,
         (SELECT id FROM categories WHERE name = 'Snacks' LIMIT 1),
         (SELECT id FROM suppliers WHERE name = 'Fornecedor Snacks' LIMIT 1),
          1, 2, 'un', 1, true, 'active', NOW(), NOW())
        ON CONFLICT (sku) DO NOTHING`,
      [productId, sku, "Produto Integracao"]
    );

    const persistedProduct = await pool.query<{ id: string }>(
      "SELECT id FROM products WHERE sku = $1 LIMIT 1",
      [sku]
    );
    productId = persistedProduct.rows[0]?.id ?? productId;

    soonLotId = randomUUID();
    lateLotId = randomUUID();
    await pool.query(
      `INSERT INTO stock_lots (
         id, product_id, code, received_quantity, remaining_quantity,
         entry_date, expiration_date, status, created_at, updated_at
       ) VALUES
          ($1, $3, $4, 10, 10, CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', 'available', NOW(), NOW()),
          ($2, $3, $5, 10, 10, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'available', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING`,
      [soonLotId, lateLotId, productId, "LOT-FEFO-SOON", "LOT-FEFO-LATE"]
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

  it("consumes nearest expiration lot first and blocks insufficient exit", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const { accessToken } = login.json();

    const firstExit = await app.inject({
      method: "POST",
      url: "/inventory/exits",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        productId,
        quantity: 5,
        reasonType: "sale"
      }
    });

    expect(firstExit.statusCode).toBe(201);
    const firstBody = firstExit.json();
    expect(firstBody.lotId).toBe(soonLotId);
    expect(firstBody.movementType).toBe("exit");

    const tooMuchExit = await app.inject({
      method: "POST",
      url: "/inventory/exits",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        productId,
        quantity: 999,
        reasonType: "sale"
      }
    });

    expect(tooMuchExit.statusCode).toBe(409);
  });

  it.each(["sale", "loss", "expiration", "breakage"] as const)(
    "supports quick-exit reason %s",
    async (reasonType) => {
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
        url: "/inventory/exits",
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          productId,
          quantity: 1,
          reasonType
        }
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().reasonType).toBe(reasonType);
    }
  );
});
