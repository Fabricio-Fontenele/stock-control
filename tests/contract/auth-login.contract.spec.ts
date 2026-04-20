import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { buildApp } from "../../src/app.js";
import { getPostgresPool } from "../../src/infrastructure/persistence/postgres/connection.js";
import { BcryptPasswordHasher } from "../../src/infrastructure/security/password-hasher.js";

describe("contract /auth/login", () => {
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

  it("returns accessToken and user payload", async () => {
    const pool = getPostgresPool();
    const existing = await pool.query<{ email: string }>(
      "SELECT email FROM users WHERE email = $1 LIMIT 1",
      ["admin@conveniencia.local"]
    );

    expect(existing.rowCount).toBeGreaterThan(0);

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body).toHaveProperty("accessToken");
    expect(body).toHaveProperty("user");
    expect(body.user).toMatchObject({
      email: "admin@conveniencia.local",
      role: "admin"
    });
  });
});
