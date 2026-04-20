import type { FastifyPluginAsync } from "fastify";

import { ListMovementsReportUseCase } from "../../../application/use-cases/list-movements-report.use-case.js";
import type { MovementFilter } from "../../../application/ports/movement-repository.js";
import { PostgresMovementRepository } from "../../../infrastructure/repositories/postgres-movement-repository.js";
import { movementReportQuerySchema } from "../schemas/report-schemas.js";
import { HttpError } from "../../../application/errors/http-error.js";

const reportRoutes: FastifyPluginAsync = async (app) => {
  app.get("/reports/movements", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const query = movementReportQuerySchema.parse(request.query);

    if (query.from > query.to) {
      throw new HttpError(400, "The 'from' date must be earlier than or equal to 'to'");
    }

    const useCase = new ListMovementsReportUseCase({
      movementRepository: new PostgresMovementRepository()
    });

    const filter: MovementFilter = {};

    if (query.from) {
      filter.from = query.from;
    }

    if (query.to) {
      filter.to = query.to;
    }

    if (query.productId) {
      filter.productId = query.productId;
    }

    if (query.reasonType) {
      filter.reasonType = query.reasonType;
    }

    const items = await useCase.execute(filter);

    return reply.status(200).send({ items });
  });
};

export default reportRoutes;
