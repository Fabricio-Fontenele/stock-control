import { randomUUID } from "node:crypto";

import { HttpError } from "../errors/http-error.js";
import type { ProductRepository } from "../ports/product-repository.js";
import type { StockRepository } from "../ports/stock-repository.js";
import type { MovementRepository } from "../ports/movement-repository.js";
import type { UnitOfWork } from "../ports/unit-of-work.js";
import type { RegisterStockEntryInput } from "../dto/stock-entry-dto.js";
import {
  STOCK_MOVEMENT_REASON,
  STOCK_MOVEMENT_TYPE,
  type StockMovement
} from "../../domain/entities/stock-movement.js";
import {
  STOCK_LOT_STATUS,
  ensureLotRemainingQuantity,
  ensurePositiveLotQuantity,
  type StockLot
} from "../../domain/entities/stock-lot.js";
import { ensureExpirationDateWhenRequired } from "../../domain/policies/expiration-policy.js";

interface RegisterStockEntryDependencies {
  productRepository: ProductRepository;
  stockRepository: StockRepository;
  movementRepository: MovementRepository;
  unitOfWork: UnitOfWork;
}

const ENTRY_REASONS = [
  STOCK_MOVEMENT_REASON.SUPPLIER_PURCHASE,
  STOCK_MOVEMENT_REASON.RESTOCK
] as const;

export class RegisterStockEntryUseCase {
  constructor(private readonly deps: RegisterStockEntryDependencies) {}

  async execute(input: RegisterStockEntryInput): Promise<StockMovement> {
    if (input.performedByRole !== "admin") {
      throw new HttpError(403, "Only admin users can register inventory entries");
    }

    if (!ENTRY_REASONS.includes(input.reasonType)) {
      throw new HttpError(400, "Invalid inventory entry reason");
    }

    ensurePositiveLotQuantity(input.quantity);

    const lotCode = input.lotCode?.trim() ? input.lotCode.trim() : `LOT-${Date.now()}`;

    const product = await this.deps.productRepository.findById(input.productId);

    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    if (product.status !== "active") {
      throw new HttpError(409, "Inactive product cannot receive common entries");
    }

    let expirationDate: Date | null;

    try {
      expirationDate = ensureExpirationDateWhenRequired(product.tracksExpiration, input.expirationDate);
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpError(400, error.message);
      }

      throw error;
    }

    const now = new Date();

    return this.deps.unitOfWork.runInTransaction(async (tx) => {
      const lot: StockLot = {
        id: randomUUID(),
        productId: input.productId,
        code: lotCode,
        receivedQuantity: input.quantity,
        remainingQuantity: ensureLotRemainingQuantity(input.quantity, input.quantity),
        entryDate: input.entryDate,
        expirationDate,
        status: STOCK_LOT_STATUS.AVAILABLE,
        createdAt: now,
        updatedAt: now
      };

      await this.deps.stockRepository.createLot(lot, tx);

      const movement: StockMovement = {
        id: randomUUID(),
        productId: input.productId,
        lotId: lot.id,
        movementType: STOCK_MOVEMENT_TYPE.ENTRY,
        reasonType: input.reasonType,
        quantity: input.quantity,
        performedByUserId: input.performedByUserId,
        approvedByUserId: input.performedByUserId,
        notes: input.notes,
        occurredAt: now,
        createdAt: now
      };

      await this.deps.movementRepository.create(movement, tx);
      return movement;
    });
  }
}
