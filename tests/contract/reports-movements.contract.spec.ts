import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { getPostgresPool } from "../../src/infrastructure/persistence/postgres/connection.js";
import { BcryptPasswordHasher } from "../../src/infrastructure/security/password-hasher.js";
import { randomUUID } from "node:crypto";

describe("contract /reports/movements", () => {
  const app = buildApp({ logger: false });

  beforeAll(async () => {
    await app.ready();

    const pool = getPostgresPool();
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

  it("enforces admin access and returns items array for admin", async () => {
    const employeeLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "employee@conveniencia.local",
        password: "employee123"
      }
    });

    const employeeToken = employeeLogin.json().accessToken;

    const employeeResponse = await app.inject({
      method: "GET",
      url: "/reports/movements?from=2026-01-01T00:00:00.000Z&to=2030-01-01T00:00:00.000Z",
      headers: {
        authorization: `Bearer ${employeeToken}`
      }
    });

    expect(employeeResponse.statusCode).toBe(403);

    const adminLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const adminToken = adminLogin.json().accessToken;

    const adminResponse = await app.inject({
      method: "GET",
      url: "/reports/movements?from=2026-01-01T00:00:00.000Z&to=2030-01-01T00:00:00.000Z",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });

    expect(adminResponse.statusCode).toBe(200);
    expect(Array.isArray(adminResponse.json().items)).toBe(true);
  });
});
