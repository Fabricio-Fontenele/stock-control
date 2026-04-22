import "dotenv/config";

import { buildApp } from "./app.js";
import { loadEnv } from "./infrastructure/config/env.js";

const start = async (): Promise<void> => {
  const env = loadEnv();
  const app = buildApp({ logger: true, env });
  const port = env.PORT;

  try {
    await app.listen({ port, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
