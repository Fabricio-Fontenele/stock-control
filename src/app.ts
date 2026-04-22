import Fastify, { type FastifyInstance } from "fastify";

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
}

const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), geolocation=()"
} as const;

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true
  });

  app.addHook("onRequest", async (request) => {
    request.log.info(
      {
        method: request.method,
        url: request.url
      },
      "request.received"
    );
  });

  app.addHook("onSend", async (request, reply, payload) => {
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      reply.header(header, value);
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

  return app;
}
