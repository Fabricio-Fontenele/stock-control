import { randomUUID } from "node:crypto";

import {
  STOCK_MOVEMENT_TYPE,
  STOCK_MOVEMENT_REASON,
  type StockMovement,
  type StockMovementReason
} from "../../domain/entities/stock-movement.js";
import { USER_ROLE } from "../../domain/entities/user.js";
import { selectLotsByFefo } from "../../domain/policies/stock-balance-policy.js";
import type { ProductRepository } from "../ports/product-repository.js";
import type { StockRepository } from "../ports/stock-repository.js";
import type {
  MovementRepository,
  RejectedMovementAttempt
} from "../ports/movement-repository.js";
import type { UnitOfWork } from "../ports/unit-of-work.js";
import { HttpError } from "../errors/http-error.js";

export interface RegisterQuickExitInput {
  productId: string;
  quantity: number;
  reasonType: StockMovementReason;
  notes: string | null;
  performedByUserId: string;
  performedByRole: "admin" | "employee";
}

interface RegisterQuickExitDependencies {
  productRepository: ProductRepository;
  stockRepository: StockRepository;
  movementRepository: MovementRepository;
  unitOfWork: UnitOfWork;
}

const ALLOWED_QUICK_EXIT_REASONS: StockMovementReason[] = ["sale", "loss", "expiration", "breakage"];
const MOVEMENT_REASON_VALUES = Object.values(STOCK_MOVEMENT_REASON) as StockMovementReason[];

export class RegisterQuickExitUseCase {
  constructor(private readonly deps: RegisterQuickExitDependencies) {}

  async execute(input: RegisterQuickExitInput): Promise<{ movements: StockMovement[] }> {
    if (input.quantity <= 0) {
      await this.safeLogRejectedAttempt(input, "Exit quantity must be greater than zero");
      throw new HttpError(400, "Exit quantity must be greater than zero");
    }

    if (!ALLOWED_QUICK_EXIT_REASONS.includes(input.reasonType)) {
      await this.safeLogRejectedAttempt(input, "Quick exit reason is invalid");
      throw new HttpError(400, "Quick exit reason is invalid");
    }

    const product = await this.deps.productRepository.findById(input.productId);

    if (!product) {
      await this.safeLogRejectedAttempt(input, "Product not found");
      throw new HttpError(404, "Product not found");
    }

    if (product.status !== "active") {
      await this.safeLogRejectedAttempt(input, "Inactive product cannot be used in common exits");
      throw new HttpError(409, "Inactive product cannot be used in common exits");
    }

    try {
      return await this.deps.unitOfWork.runInTransaction(async (tx) => {
        const occurredAt = new Date();
        const lots = await this.deps.stockRepository.findLotsByProduct(input.productId, tx);
        const consumptionPlan = selectLotsByFefo(lots, input.quantity, occurredAt);

        const movements: StockMovement[] = [];

        for (const planned of consumptionPlan) {
          const lot = lots.find((item) => item.id === planned.lotId);

          if (!lot) {
            throw new HttpError(409, "Selected lot is no longer available");
          }

          lot.remainingQuantity -= planned.quantity;
          lot.updatedAt = new Date();
          await this.deps.stockRepository.updateLot(lot, tx);

          const movement: StockMovement = {
            id: randomUUID(),
            productId: input.productId,
            lotId: lot.id,
            movementType: STOCK_MOVEMENT_TYPE.EXIT,
            reasonType: input.reasonType,
            quantity: planned.quantity,
            performedByUserId: input.performedByUserId,
            approvedByUserId: input.performedByRole === USER_ROLE.ADMIN ? input.performedByUserId : null,
            notes: input.notes,
            occurredAt,
            createdAt: occurredAt
          };

          await this.deps.movementRepository.create(movement, tx);
          movements.push(movement);
        }

        return { movements };
      });
    } catch (error) {
      await this.safeLogRejectedAttempt(input, error instanceof Error ? error.message : "Unknown rejection");

      if (error instanceof HttpError) {
        throw error;
      }

      throw new HttpError(409, "Insufficient available stock or no eligible lot for exit");
    }
  }

  private async safeLogRejectedAttempt(input: RegisterQuickExitInput, failureReason: string): Promise<void> {
    try {
      await this.logRejectedAttempt(input, failureReason);
    } catch {
      // Keep primary business error as source of truth.
    }
  }

  private async logRejectedAttempt(input: RegisterQuickExitInput, failureReason: string): Promise<void> {
    const rejectedAttempt: RejectedMovementAttempt = {
      id: randomUUID(),
      productId: input.productId,
      requestedQuantity: input.quantity,
      reasonType: MOVEMENT_REASON_VALUES.includes(input.reasonType)
        ? input.reasonType
        : STOCK_MOVEMENT_REASON.SALE,
      attemptedByUserId: input.performedByUserId,
      attemptedAt: new Date(),
      failureReason,
      notes: input.notes
    };

    await this.deps.movementRepository.createRejectedAttempt(rejectedAttempt);
  }
}
