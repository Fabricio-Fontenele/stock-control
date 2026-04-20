import type { FastifyPluginAsync } from "fastify";

import { SearchStockUseCase } from "../../../application/use-cases/search-stock.use-case.js";
import { RegisterQuickExitUseCase } from "../../../application/use-cases/register-quick-exit.use-case.js";
import { RegisterStockEntryUseCase } from "../../../application/use-cases/register-stock-entry.use-case.js";
import { RegisterInventoryAdjustmentUseCase } from "../../../application/use-cases/register-inventory-adjustment.use-case.js";
import { DeleteStockMovementUseCase } from "../../../application/use-cases/delete-stock-movement.use-case.js";
import { PostgresStockRepository } from "../../../infrastructure/repositories/postgres-stock-repository.js";
import { PostgresProductRepository } from "../../../infrastructure/repositories/postgres-product-repository.js";
import { PostgresMovementRepository } from "../../../infrastructure/repositories/postgres-movement-repository.js";
import { PostgresUnitOfWork } from "../../../infrastructure/persistence/postgres/postgres-unit-of-work.js";
import {
  inventoryAdjustmentSchema,
  inventoryEntrySchema,
  inventoryExitSchema,
  inventorySearchQuerySchema
} from "../schemas/inventory-schemas.js";
import {
  presentMovement,
  presentStockSnapshot
} from "../../presenters/http-presenters.js";
import { PostgresUserRepository } from "../../../infrastructure/repositories/postgres-user-repository.js";
import { HttpError } from "../../../application/errors/http-error.js";

const asRole = (role: unknown): "admin" | "employee" => {
  if (role === "admin" || role === "employee") {
    return role;
  }

  throw new HttpError(403, "Unsupported role");
};

const inventoryRoutes: FastifyPluginAsync = async (app) => {
  app.post("/inventory/entries", { preHandler: app.authenticate }, async (request, reply) => {
    const payload = inventoryEntrySchema.parse(request.body);
    const user = request.user;

    if (!user?.sub || !user?.role) {
      throw new HttpError(401, "Invalid authentication payload");
    }

    const userRepository = new PostgresUserRepository();
    const performedByUser = await userRepository.findById(user.sub);

    if (!performedByUser) {
      throw new HttpError(401, "Authenticated user not found");
    }

    const useCase = new RegisterStockEntryUseCase({
      productRepository: new PostgresProductRepository(),
      stockRepository: new PostgresStockRepository(),
      movementRepository: new PostgresMovementRepository(),
      unitOfWork: new PostgresUnitOfWork()
    });

    const movement = await useCase.execute({
      productId: payload.productId,
      lotCode: payload.lotCode ?? null,
      quantity: payload.quantity,
      entryDate: payload.entryDate,
      expirationDate: payload.expirationDate,
      reasonType: payload.reasonType,
      notes: payload.notes ?? null,
      performedByUserId: user.sub,
      performedByRole: asRole(user.role)
    });

    const response = presentMovement(movement, {
      id: performedByUser.id,
      name: performedByUser.name,
      email: performedByUser.email,
      role: performedByUser.role
    });

    return reply.status(201).send(response);
  });

  app.post(
    "/inventory/adjustments",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const payload = inventoryAdjustmentSchema.parse(request.body);
      const user = request.user;

      if (!user?.sub || !user?.role) {
        throw new HttpError(401, "Invalid authentication payload");
      }

      const userRepository = new PostgresUserRepository();
      const performedByUser = await userRepository.findById(user.sub);

      if (!performedByUser) {
        throw new HttpError(401, "Authenticated user not found");
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
        performedByUserId: user.sub,
        performedByRole: asRole(user.role)
      });

      const response = presentMovement(movement, {
        id: performedByUser.id,
        name: performedByUser.name,
        email: performedByUser.email,
        role: performedByUser.role
      });

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

  app.post("/inventory/exits", { preHandler: app.authenticate }, async (request, reply) => {
    const payload = inventoryExitSchema.parse(request.body);
    const user = request.user;

    if (!user?.sub || !user?.role) {
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
      performedByUserId: user.sub,
      performedByRole: asRole(user.role)
    });

    const userRepository = new PostgresUserRepository();
    const performedByUser = await userRepository.findById(user.sub);

    if (!performedByUser) {
      throw new HttpError(401, "Authenticated user not found");
    }

    const firstMovement = result.movements[0];

    if (!firstMovement) {
      throw new HttpError(409, "No movement generated for exit");
    }

    const movementView = presentMovement(firstMovement, {
      id: performedByUser.id,
      name: performedByUser.name,
      email: performedByUser.email,
      role: performedByUser.role
    });

    return reply.status(201).send(movementView);
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
