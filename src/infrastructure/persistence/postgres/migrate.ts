import "dotenv/config";

import { getPostgresPool, closePostgresPool } from "./connection.js";
import { createInitialSchemaSql } from "./migrations/001_initial_schema.js";
import { makeProductSupplierOptionalAndCreateSkuSequenceSql } from "./migrations/002_product_supplier_optional_and_sku_sequence.js";

const run = async (): Promise<void> => {
  const pool = getPostgresPool();

  try {
    await pool.query(createInitialSchemaSql);
    await pool.query(makeProductSupplierOptionalAndCreateSkuSequenceSql);
    process.stdout.write("Initial schema applied successfully.\n");
  } finally {
    await closePostgresPool();
  }
};

void run();
