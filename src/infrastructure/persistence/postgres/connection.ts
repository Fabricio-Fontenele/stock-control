import { Pool, type PoolClient } from "pg";

import { loadEnv } from "../../config/env.js";

let pool: Pool | null = null;

const createPool = (): Pool => {
  const env = loadEnv();

  return new Pool({
    connectionString: env.DATABASE_URL,
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    database: env.DATABASE_NAME,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30_000
  });
};

export const getPostgresPool = (): Pool => {
  if (!pool) {
    pool = createPool();
  }

  return pool;
};

export const getPostgresClient = async (): Promise<PoolClient> => {
  const currentPool = getPostgresPool();
  return currentPool.connect();
};

export const closePostgresPool = async (): Promise<void> => {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
};
