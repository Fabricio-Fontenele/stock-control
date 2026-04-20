import { z } from "zod";

const DEFAULT_DATABASE_URL = "postgres://postgres:postgres@localhost:5433/stock_control";
const DEFAULT_JWT_SECRET = "dev-only-secret-change-me";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default(DEFAULT_DATABASE_URL),
  DATABASE_HOST: z.string().default("localhost"),
  DATABASE_PORT: z.coerce.number().int().positive().default(5433),
  DATABASE_NAME: z.string().min(1).default("stock_control"),
  DATABASE_USER: z.string().min(1).default("postgres"),
  DATABASE_PASSWORD: z.string().min(1).default("postgres"),
  JWT_SECRET: z.string().min(16).default(DEFAULT_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default("8h")
});

export type Env = z.infer<typeof envSchema>;

export const loadEnv = (): Env => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }

  if (parsed.data.NODE_ENV === "production" && parsed.data.JWT_SECRET === DEFAULT_JWT_SECRET) {
    throw new Error("JWT_SECRET must be explicitly set in production");
  }

  return parsed.data;
};
