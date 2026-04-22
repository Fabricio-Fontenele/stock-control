import type { QueryResult } from "pg";

import { type User } from "../../domain/entities/user.js";
import type { UserRepository } from "../../application/ports/user-repository.js";
import { getPostgresPool } from "../persistence/postgres/connection.js";

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: User["role"];
  status: User["status"];
  created_at: Date;
  updated_at: Date;
}

const mapUserRow = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.password_hash,
  role: row.role,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export class PostgresUserRepository implements UserRepository {
  private readonly pool = getPostgresPool();

  async create(user: User): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO users (
        id,
        name,
        email,
        password_hash,
        role,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        user.id,
        user.name,
        user.email,
        user.passwordHash,
        user.role,
        user.status,
        user.createdAt,
        user.updatedAt
      ]
    );
  }

  async findById(id: string): Promise<User | null> {
    const result: QueryResult<UserRow> = await this.pool.query(
      `
      SELECT id, name, email, password_hash, role, status, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    const row = result.rows[0];
    return row ? mapUserRow(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result: QueryResult<UserRow> = await this.pool.query(
      `
      SELECT id, name, email, password_hash, role, status, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email.trim()]
    );

    const row = result.rows[0];
    return row ? mapUserRow(row) : null;
  }

  async update(user: User): Promise<void> {
    await this.pool.query(
      `
      UPDATE users
      SET name = $2, email = $3, password_hash = $4, role = $5, status = $6, updated_at = $7
      WHERE id = $1
      `,
      [
        user.id,
        user.name,
        user.email,
        user.passwordHash,
        user.role,
        user.status,
        user.updatedAt
      ]
    );
  }

  async list(): Promise<User[]> {
    const result: QueryResult<UserRow> = await this.pool.query(
      `
      SELECT id, name, email, password_hash, role, status, created_at, updated_at
      FROM users
      ORDER BY name ASC
      `
    );

    return result.rows.map(mapUserRow);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM users WHERE id = $1`,
      [id]
    );
  }
}
