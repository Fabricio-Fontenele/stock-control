export const STOCK_LOT_STATUS = {
  AVAILABLE: "available",
  DEPLETED: "depleted",
  EXPIRED: "expired",
  BLOCKED: "blocked"
} as const;

export type StockLotStatus = (typeof STOCK_LOT_STATUS)[keyof typeof STOCK_LOT_STATUS];
export type StockLotId = string;

export interface StockLot {
  id: StockLotId;
  productId: string;
  code: string;
  receivedQuantity: number;
  remainingQuantity: number;
  entryDate: Date;
  expirationDate: Date | null;
  status: StockLotStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const ensurePositiveLotQuantity = (value: number): number => {
  if (value <= 0) {
    throw new Error("Lot quantity must be greater than zero");
  }

  return value;
};

export const ensureLotRemainingQuantity = (
  remainingQuantity: number,
  receivedQuantity: number
): number => {
  if (remainingQuantity < 0 || remainingQuantity > receivedQuantity) {
    throw new Error("Lot remaining quantity must be between zero and received quantity");
  }

  return remainingQuantity;
};
