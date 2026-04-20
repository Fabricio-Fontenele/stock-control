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

export interface BuildAppOptions {
  logger?: boolean;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true
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

  app.get("/health", async () => {
    return {
      status: "ok"
    };
  });

  return app;
}
