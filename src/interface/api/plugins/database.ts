import fp from "fastify-plugin";

import {
  getPostgresPool,
  closePostgresPool
} from "../../../infrastructure/persistence/postgres/connection.js";

declare module "fastify" {
  interface FastifyInstance {
    db: ReturnType<typeof getPostgresPool>;
  }
}

const databasePlugin = fp(async (app) => {
  const pool = getPostgresPool();
  app.decorate("db", pool);

  app.addHook("onClose", async () => {
    await closePostgresPool();
  });
});

export default databasePlugin;
