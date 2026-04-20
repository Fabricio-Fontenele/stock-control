import { type Product } from "../entities/product.js";
import { type StockLot } from "../entities/stock-lot.js";

const BLOCKED_LOT_STATUS = "blocked";

export interface ConsumptionPlan {
  lotId: string;
  quantity: number;
}

const normalizeDate = (value: Date): number => {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
};

const hasExpiration = (lot: StockLot): lot is StockLot & { expirationDate: Date } => {
  return lot.expirationDate instanceof Date;
};

const isExpiredLot = (lot: StockLot, referenceDate: Date): boolean => {
  if (!hasExpiration(lot)) {
    return false;
  }

  return normalizeDate(lot.expirationDate) < normalizeDate(referenceDate);
};

export const selectLotsByFefo = (
  lots: StockLot[],
  quantity: number,
  referenceDate: Date = new Date()
): ConsumptionPlan[] => {
  if (quantity <= 0) {
    throw new Error("Exit quantity must be greater than zero");
  }

  const eligibleLots = lots
    .filter((lot) => lot.remainingQuantity > 0)
    .filter((lot) => lot.status !== BLOCKED_LOT_STATUS)
    .filter((lot) => !isExpiredLot(lot, referenceDate))
    .sort((a, b) => {
      const aExpiration = hasExpiration(a) ? normalizeDate(a.expirationDate) : Number.MAX_SAFE_INTEGER;
      const bExpiration = hasExpiration(b) ? normalizeDate(b.expirationDate) : Number.MAX_SAFE_INTEGER;

      if (aExpiration !== bExpiration) {
        return aExpiration - bExpiration;
      }

      return normalizeDate(a.entryDate) - normalizeDate(b.entryDate);
    });

  let remaining = quantity;
  const plan: ConsumptionPlan[] = [];

  for (const lot of eligibleLots) {
    if (remaining === 0) {
      break;
    }

    const consumed = Math.min(remaining, lot.remainingQuantity);
    plan.push({ lotId: lot.id, quantity: consumed });
    remaining -= consumed;
  }

  if (remaining > 0) {
    throw new Error("Insufficient available balance for requested exit");
  }

  return plan;
};

export const ensurePositiveStockBalance = (
  currentAvailableQuantity: number,
  exitQuantity: number
): number => {
  if (exitQuantity <= 0) {
    throw new Error("Exit quantity must be greater than zero");
  }

  const nextBalance = currentAvailableQuantity - exitQuantity;

  if (nextBalance < 0) {
    throw new Error("Negative stock is not allowed");
  }

  return nextBalance;
};

export const isBelowMinimumStock = (
  product: Pick<Product, "minimumStock">,
  currentAvailableQuantity: number
): boolean => {
  return currentAvailableQuantity < product.minimumStock;
};
