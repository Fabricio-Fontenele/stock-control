import { getPostgresClient } from "./connection.js";
import type { TransactionContext, UnitOfWork } from "../../../application/ports/unit-of-work.js";

export class PostgresUnitOfWork implements UnitOfWork {
  async runInTransaction<T>(operation: (tx: TransactionContext) => Promise<T>): Promise<T> {
    const client = await getPostgresClient();

    try {
      await client.query("BEGIN");

      const tx: TransactionContext = {
        query: async (text, values) => {
          const result = await client.query(text, values);
          return {
            rows: result.rows,
            rowCount: result.rowCount
          };
        }
      };

      const output = await operation(tx);
      await client.query("COMMIT");
      return output;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
