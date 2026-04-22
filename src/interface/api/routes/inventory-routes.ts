import type { FastifyPluginAsync } from "fastify";

import { SearchStockUseCase } from "../../../application/use-cases/search-stock.use-case.js";
import { RegisterQuickExitUseCase } from "../../../application/use-cases/register-quick-exit.use-case.js";
import { RegisterStockEntryUseCase } from "../../../application/use-cases/register-stock-entry.use-case.js";
import { RegisterInventoryAdjustmentUseCase } from "../../../application/use-cases/register-inventory-adjustment.use-case.js";
import { ApproveExpiredReleaseUseCase } from "../../../application/use-cases/approve-expired-release.use-case.js";
import { DeleteStockMovementUseCase } from "../../../application/use-cases/delete-stock-movement.use-case.js";
import { PostgresStockRepository } from "../../../infrastructure/repositories/postgres-stock-repository.js";
import { PostgresProductRepository } from "../../../infrastructure/repositories/postgres-product-repository.js";
import { PostgresMovementRepository } from "../../../infrastructure/repositories/postgres-movement-repository.js";
import { PostgresUnitOfWork } from "../../../infrastructure/persistence/postgres/postgres-unit-of-work.js";
import {
  inventoryAdjustmentSchema,
  expiredReleaseSchema,
  inventoryEntrySchema,
  inventoryExitSchema,
  inventorySearchQuerySchema
} from "../schemas/inventory-schemas.js";
import {
  presentMovement,
  presentStockSnapshot
} from "../../presenters/http-presenters.js";
import { HttpError } from "../../../application/errors/http-error.js";

const inventoryRoutes: FastifyPluginAsync = async (app) => {
  app.post("/inventory/entries", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const payload = inventoryEntrySchema.parse(request.body);
    const currentUser = request.currentUser;

    if (!currentUser) {
      throw new HttpError(401, "Invalid authentication payload");
    }

    const useCase = new RegisterStockEntryUseCase({
      productRepository: new PostgresProductRepository(),
      stockRepository: new PostgresStockRepository(),
      movementRepository: new PostgresMovementRepository(),
      unitOfWork: new PostgresUnitOfWork()
    });

    const movement = await useCase.execute({
      productId: payload.productId,
      quantity: payload.quantity,
      entryDate: payload.entryDate,
      reasonType: payload.reasonType,
      notes: payload.notes ?? null,
      performedByUserId: currentUser.id,
      performedByRole: currentUser.role
    });

    const response = presentMovement(movement, currentUser);

    return reply.status(201).send(response);
  });

  app.post(
    "/inventory/adjustments",
    { preHandler: app.ensureAdmin },
    async (request, reply) => {
      const payload = inventoryAdjustmentSchema.parse(request.body);
      const currentUser = request.currentUser;

      if (!currentUser) {
        throw new HttpError(401, "Invalid authentication payload");
      }

      const useCase = new RegisterInventoryAdjustmentUseCase({
        productRepository: new PostgresProductRepository(),
        stockRepository: new PostgresStockRepository(),
        movementRepository: new PostgresMovementRepository(),
        unitOfWork: new PostgresUnitOfWork()
      });

      const movement = await useCase.execute({
        productId: payload.productId,
        direction: payload.direction,
        quantity: payload.quantity,
        reason: payload.reason,
        lotId: payload.lotId ?? null,
        performedByUserId: currentUser.id,
        performedByRole: currentUser.role
      });

      const response = presentMovement(movement, currentUser);

      return reply.status(201).send(response);
    }
  );

  app.get("/inventory/stock", { preHandler: app.authenticate }, async (request, reply) => {
    const query = inventorySearchQuerySchema.parse(request.query);
    const useCase = new SearchStockUseCase({
      stockRepository: new PostgresStockRepository()
    });

    const snapshots = await useCase.execute(query.search);
    return reply.status(200).send({
      items: snapshots.map((snapshot) => presentStockSnapshot(snapshot))
    });
  });

  app.post(
    "/inventory/expired-release",
    { preHandler: app.ensureAdmin },
    async (request, reply) => {
      const payload = expiredReleaseSchema.parse(request.body);
      const currentUser = request.currentUser;

      if (!currentUser) {
        throw new HttpError(401, "Invalid authentication payload");
      }

      const useCase = new ApproveExpiredReleaseUseCase({
        productRepository: new PostgresProductRepository(),
        stockRepository: new PostgresStockRepository(),
        movementRepository: new PostgresMovementRepository(),
        unitOfWork: new PostgresUnitOfWork()
      });

      const movement = await useCase.execute({
        productId: payload.productId,
        lotId: payload.lotId,
        quantity: payload.quantity,
        reason: payload.reason,
        performedByUserId: currentUser.id,
        performedByRole: currentUser.role
      });

      return reply.status(201).send(presentMovement(movement, currentUser, currentUser));
    }
  );

  app.post("/inventory/exits", { preHandler: app.authenticate }, async (request, reply) => {
    const payload = inventoryExitSchema.parse(request.body);
    const currentUser = request.currentUser;

    if (!currentUser) {
      throw new HttpError(401, "Invalid authentication payload");
    }

    const useCase = new RegisterQuickExitUseCase({
      productRepository: new PostgresProductRepository(),
      stockRepository: new PostgresStockRepository(),
      movementRepository: new PostgresMovementRepository(),
      unitOfWork: new PostgresUnitOfWork()
    });

    const result = await useCase.execute({
      productId: payload.productId,
      quantity: payload.quantity,
      reasonType: payload.reasonType,
      notes: payload.notes ?? null,
      performedByUserId: currentUser.id,
      performedByRole: currentUser.role
    });

    const firstMovement = result.movements[0];

    if (!firstMovement) {
      throw new HttpError(409, "No movement generated for exit");
    }

    const movementView = presentMovement(firstMovement, currentUser);

    return reply.status(201).send({
      ...movementView,
      movements: result.movements.map((movement) => presentMovement(movement, currentUser))
    });
  });

  app.delete(
    "/inventory/movements/:movementId",
    { preHandler: app.ensureAdmin },
    async (_request, _reply) => {
      const useCase = new DeleteStockMovementUseCase();
      useCase.execute();
    }
  );
};

export default inventoryRoutes;
