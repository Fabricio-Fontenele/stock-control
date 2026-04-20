import { randomUUID } from "node:crypto";

import { ensureExpiredReleaseAuthorization, STOCK_MOVEMENT_REASON, STOCK_MOVEMENT_TYPE, type StockMovement } from "../../domain/entities/stock-movement.js";
import { STOCK_LOT_STATUS, ensureLotRemainingQuantity } from "../../domain/entities/stock-lot.js";
import { isLotExpired } from "../../domain/policies/expiration-policy.js";
import { HttpError } from "../errors/http-error.js";
import type { MovementRepository } from "../ports/movement-repository.js";
import type { ProductRepository } from "../ports/product-repository.js";
import type { StockRepository } from "../ports/stock-repository.js";
import type { UnitOfWork } from "../ports/unit-of-work.js";
import type { ApproveExpiredReleaseInput } from "../dto/expired-release-dto.js";

interface ApproveExpiredReleaseDependencies {
  productRepository: ProductRepository;
  stockRepository: StockRepository;
  movementRepository: MovementRepository;
  unitOfWork: UnitOfWork;
}

export class ApproveExpiredReleaseUseCase {
  constructor(private readonly deps: ApproveExpiredReleaseDependencies) {}

  async execute(input: ApproveExpiredReleaseInput): Promise<StockMovement> {
    try {
      ensureExpiredReleaseAuthorization({
        performedByRole: input.performedByRole,
        reason: input.reason,
        approvedByUserId: input.performedByUserId
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpError(400, error.message);
      }

      throw error;
    }

    if (input.quantity <= 0) {
      throw new HttpError(400, "Expired release quantity must be greater than zero");
    }

    const product = await this.deps.productRepository.findById(input.productId);

    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    const now = new Date();

    return this.deps.unitOfWork.runInTransaction(async (tx) => {
      const lots = await this.deps.stockRepository.findLotsByProduct(input.productId, tx);
      const lot = lots.find((item) => item.id === input.lotId);

      if (!lot) {
        throw new HttpError(404, "Lot not found for product");
      }

      if (!isLotExpired(lot, now)) {
        throw new HttpError(409, "Only expired lots can be released exceptionally");
      }

      if (lot.remainingQuantity < input.quantity) {
        throw new HttpError(409, "Insufficient quantity in expired lot");
      }

      lot.remainingQuantity = ensureLotRemainingQuantity(
        lot.remainingQuantity - input.quantity,
        lot.receivedQuantity
      );
      lot.updatedAt = now;
      lot.status = lot.remainingQuantity === 0 ? STOCK_LOT_STATUS.DEPLETED : STOCK_LOT_STATUS.EXPIRED;
      await this.deps.stockRepository.updateLot(lot, tx);

      const movement: StockMovement = {
        id: randomUUID(),
        productId: input.productId,
        lotId: lot.id,
        movementType: STOCK_MOVEMENT_TYPE.EXPIRED_RELEASE,
        reasonType: STOCK_MOVEMENT_REASON.SALE,
        quantity: input.quantity,
        performedByUserId: input.performedByUserId,
        approvedByUserId: input.performedByUserId,
        notes: input.reason.trim(),
        occurredAt: now,
        createdAt: now
      };

      await this.deps.movementRepository.create(movement, tx);
      return movement;
    });
  }
}
