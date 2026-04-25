import Fastify, { type FastifyInstance } from "fastify";

import type { Env } from "./infrastructure/config/env.js";
import { loadEnv } from "./infrastructure/config/env.js";
import authPlugin from "./interface/api/plugins/auth.js";
import databasePlugin from "./interface/api/plugins/database.js";
import errorHandlerPlugin from "./interface/api/plugins/error-handler.js";
import authRoutes from "./interface/api/routes/auth-routes.js";
import categoryRoutes from "./interface/api/routes/category-routes.js";
import inventoryRoutes from "./interface/api/routes/inventory-routes.js";
import dashboardRoutes from "./interface/api/routes/dashboard-routes.js";
import reportRoutes from "./interface/api/routes/report-routes.js";
import productRoutes from "./interface/api/routes/product-routes.js";
import supplierRoutes from "./interface/api/routes/supplier-routes.js";
import userRoutes from "./interface/api/routes/user-routes.js";

export interface BuildAppOptions {
  logger?: boolean;
  env?: Env;
}

const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), geolocation=()"
} as const;

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const env = options.env ?? loadEnv();
  const allowedOrigins = env.CORS_ALLOWED_ORIGINS
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  const allowedOriginsSet = new Set(allowedOrigins);

  const resolveAllowedOrigin = (origin: string | undefined): string | null => {
    if (!origin) {
      return null;
    }

    return allowedOriginsSet.has(origin) ? origin : null;
  };

  const app = Fastify({
    logger: options.logger ?? true
  });

  app.addHook("onRequest", async (request, reply) => {
    const requestOrigin = typeof request.headers.origin === "string"
      ? request.headers.origin
      : undefined;
    const allowedOrigin = resolveAllowedOrigin(requestOrigin);

    if (request.method === "OPTIONS") {
      if (!requestOrigin || !allowedOrigin) {
        return reply.status(403).send();
      }

      reply
        .header("vary", "origin")
        .header("access-control-allow-origin", allowedOrigin)
        .header("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS")
        .header("access-control-allow-headers", "content-type,authorization")
        .header("access-control-max-age", "86400")
        .status(204);

      return reply.send();
    }

    request.log.info(
      {
        method: request.method,
        url: request.url
      },
      "request.received"
    );
  });

  app.addHook("onSend", async (request, reply, payload) => {
    const requestOrigin = typeof request.headers.origin === "string"
      ? request.headers.origin
      : undefined;
    const allowedOrigin = resolveAllowedOrigin(requestOrigin);

    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      reply.header(header, value);
    }

    if (allowedOrigin) {
      reply
        .header("vary", "origin")
        .header("access-control-allow-origin", allowedOrigin)
        .header("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS")
        .header("access-control-allow-headers", "content-type,authorization");
    }

    if (request.protocol === "https") {
      reply.header("strict-transport-security", "max-age=31536000; includeSubDomains");
    }

    return payload;
  });

  app.addHook("onResponse", async (request, reply) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime
      },
      "request.completed"
    );
  });

  app.register(databasePlugin);
  app.register(authPlugin);
  app.register(errorHandlerPlugin);

  app.register(authRoutes);
  app.register(categoryRoutes);
  app.register(productRoutes);
  app.register(inventoryRoutes);
  app.register(dashboardRoutes);
  app.register(reportRoutes);
  app.register(supplierRoutes);
  app.register(userRoutes);

  app.get("/health", async () => {
    return {
      status: "ok"
    };
  });

  app.get("/ready", async (_request, reply) => {
    try {
      await app.db.query("SELECT 1");

      return {
        status: "ready",
        checks: {
          database: "ok"
        }
      };
    } catch (error) {
      app.log.error({ error }, "readiness.check.failed");

      return reply.status(503).send({
        status: "not_ready",
        checks: {
          database: "error"
        }
      });
    }
  });

  return app;
}
