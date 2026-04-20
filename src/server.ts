import "dotenv/config";

import { buildApp } from "./app.js";

const DEFAULT_PORT = 3000;

const parsePort = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_PORT;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? DEFAULT_PORT : parsed;
};

const start = async (): Promise<void> => {
  const app = buildApp({ logger: true });
  const port = parsePort(process.env.PORT);

  try {
    await app.listen({ port, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
