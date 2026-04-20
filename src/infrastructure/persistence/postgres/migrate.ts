import "dotenv/config";

import { getPostgresPool, closePostgresPool } from "./connection.js";
import { createInitialSchemaSql } from "./migrations/001_initial_schema.js";

const run = async (): Promise<void> => {
  const pool = getPostgresPool();

  try {
    await pool.query(createInitialSchemaSql);
    process.stdout.write("Initial schema applied successfully.\n");
  } finally {
    await closePostgresPool();
  }
};

void run();
