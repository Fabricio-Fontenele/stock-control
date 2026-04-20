import type { FastifyPluginAsync } from "fastify";

import { GetDashboardAlertsUseCase } from "../../../application/use-cases/get-dashboard-alerts.use-case.js";
import { PostgresStockRepository } from "../../../infrastructure/repositories/postgres-stock-repository.js";
import { dashboardAlertQuerySchema } from "../schemas/report-schemas.js";

const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/dashboard/alerts", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const query = dashboardAlertQuerySchema.parse(request.query);

    const useCase = new GetDashboardAlertsUseCase({
      stockRepository: new PostgresStockRepository()
    });

    const output = await useCase.execute(query.referenceDate ?? new Date());
    return reply.status(200).send(output);
  });
};

export default dashboardRoutes;
