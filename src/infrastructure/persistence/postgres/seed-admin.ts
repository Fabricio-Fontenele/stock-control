import "dotenv/config";

import { randomUUID } from "node:crypto";

import { USER_ROLE, USER_STATUS } from "../../../domain/entities/user.js";
import { getPostgresPool, closePostgresPool } from "./connection.js";
import { BcryptPasswordHasher } from "../../security/password-hasher.js";

const DEFAULT_ADMIN_EMAIL = "admin@conveniencia.local";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const DEFAULT_ADMIN_NAME = "Admin Conveniencia";

const run = async (): Promise<void> => {
  const pool = getPostgresPool();
  const hasher = new BcryptPasswordHasher();

  const email = (process.env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? DEFAULT_ADMIN_NAME;

  try {
    const existing = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      process.stdout.write(`Admin already exists for email ${email}.\n`);
      return;
    }

    const passwordHash = await hasher.hash(password);
    const now = new Date();

    await pool.query(
      `
      INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        randomUUID(),
        name,
        email,
        passwordHash,
        USER_ROLE.ADMIN,
        USER_STATUS.ACTIVE,
        now,
        now
      ]
    );

    process.stdout.write(`Admin user seeded with email ${email}.\n`);
  } finally {
    await closePostgresPool();
  }
};

void run();
