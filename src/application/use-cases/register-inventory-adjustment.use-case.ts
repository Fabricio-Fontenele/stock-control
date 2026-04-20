import { randomUUID } from "node:crypto";

import { HttpError } from "../errors/http-error.js";
import type { ProductRepository } from "../ports/product-repository.js";
import type { StockRepository } from "../ports/stock-repository.js";
import type { MovementRepository } from "../ports/movement-repository.js";
import type { UnitOfWork } from "../ports/unit-of-work.js";
import type { RegisterInventoryAdjustmentInput } from "../dto/inventory-adjustment-dto.js";
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

interface RegisterInventoryAdjustmentDependencies {
  productRepository: ProductRepository;
  stockRepository: StockRepository;
  movementRepository: MovementRepository;
  unitOfWork: UnitOfWork;
}

export class RegisterInventoryAdjustmentUseCase {
  constructor(private readonly deps: RegisterInventoryAdjustmentDependencies) {}

  async execute(input: RegisterInventoryAdjustmentInput): Promise<StockMovement> {
    if (input.performedByRole !== "admin") {
      throw new HttpError(403, "Only admin users can register inventory adjustments");
    }

    const reason = input.reason.trim();
    if (!reason) {
      throw new HttpError(400, "Adjustment reason is required");
    }

    ensurePositiveLotQuantity(input.quantity);

    const product = await this.deps.productRepository.findById(input.productId);
    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    const now = new Date();

    return this.deps.unitOfWork.runInTransaction(async (tx) => {
      let lotId: string | null = input.lotId;

      if (input.direction === "entrada") {
        if (lotId) {
          const lots = await this.deps.stockRepository.findLotsByProduct(input.productId, tx);
          const lot = lots.find((item) => item.id === lotId);

          if (!lot) {
            throw new HttpError(404, "Lot not found for product");
          }

          lot.remainingQuantity = ensureLotRemainingQuantity(
            lot.remainingQuantity + input.quantity,
            lot.receivedQuantity + input.quantity
          );
          lot.receivedQuantity += input.quantity;
          lot.status = STOCK_LOT_STATUS.AVAILABLE;
          lot.updatedAt = now;
          await this.deps.stockRepository.updateLot(lot, tx);
        } else {
          const createdLot: StockLot = {
            id: randomUUID(),
            productId: input.productId,
            code: `ADJ-${now.getTime()}`,
            receivedQuantity: input.quantity,
            remainingQuantity: input.quantity,
            entryDate: now,
            expirationDate: null,
            status: STOCK_LOT_STATUS.AVAILABLE,
            createdAt: now,
            updatedAt: now
          };

          await this.deps.stockRepository.createLot(createdLot, tx);
          lotId = createdLot.id;
        }
      }

      if (input.direction === "saida") {
        const lots = await this.deps.stockRepository.findLotsByProduct(input.productId, tx);

        if (lots.length === 0) {
          throw new HttpError(409, "No stock lots available for adjustment exit");
        }

        let remaining = input.quantity;
        const orderedLots = [...lots].sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());

        for (const lot of orderedLots) {
          if (remaining <= 0) {
            break;
          }

          if (lot.remainingQuantity <= 0) {
            continue;
          }

          const consume = Math.min(lot.remainingQuantity, remaining);
          lot.remainingQuantity = ensureLotRemainingQuantity(lot.remainingQuantity - consume, lot.receivedQuantity);
          lot.updatedAt = now;
          lot.status = lot.remainingQuantity === 0 ? STOCK_LOT_STATUS.DEPLETED : lot.status;
          await this.deps.stockRepository.updateLot(lot, tx);
          remaining -= consume;
          lotId = lot.id;
        }

        if (remaining > 0) {
          throw new HttpError(409, "Insufficient stock for inventory adjustment exit");
        }
      }

      const movement: StockMovement = {
        id: randomUUID(),
        productId: input.productId,
        lotId,
        movementType:
          input.direction === "entrada" ? STOCK_MOVEMENT_TYPE.ENTRY : STOCK_MOVEMENT_TYPE.EXIT,
        reasonType: STOCK_MOVEMENT_REASON.INVENTORY_ADJUSTMENT,
        quantity: input.quantity,
        performedByUserId: input.performedByUserId,
        approvedByUserId: input.performedByUserId,
        notes: reason,
        occurredAt: now,
        createdAt: now
      };

      await this.deps.movementRepository.create(movement, tx);
      return movement;
    });
  }
}
