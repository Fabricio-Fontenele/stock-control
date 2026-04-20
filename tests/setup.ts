import "dotenv/config";

process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT ?? "3333";
process.env.DATABASE_HOST = process.env.DATABASE_HOST ?? "localhost";
process.env.DATABASE_PORT = process.env.DATABASE_PORT ?? "5433";
process.env.DATABASE_NAME = process.env.DATABASE_NAME ?? "stock_control";
process.env.DATABASE_USER = process.env.DATABASE_USER ?? "postgres";
process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD ?? "postgres";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5433/stock_control";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-secret-change-me";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";
