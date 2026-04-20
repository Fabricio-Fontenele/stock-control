export const STOCK_MOVEMENT_TYPE = {
  ENTRY: "entry",
  EXIT: "exit",
  ADJUSTMENT: "adjustment",
  EXPIRED_RELEASE: "expired-release"
} as const;

export const STOCK_MOVEMENT_REASON = {
  SUPPLIER_PURCHASE: "supplier-purchase",
  RESTOCK: "restock",
  INVENTORY_ADJUSTMENT: "inventory-adjustment",
  SALE: "sale",
  LOSS: "loss",
  EXPIRATION: "expiration",
  BREAKAGE: "breakage"
} as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPE)[keyof typeof STOCK_MOVEMENT_TYPE];
export type StockMovementReason =
  (typeof STOCK_MOVEMENT_REASON)[keyof typeof STOCK_MOVEMENT_REASON];

export interface StockMovement {
  id: string;
  productId: string;
  lotId: string | null;
  movementType: StockMovementType;
  reasonType: StockMovementReason;
  quantity: number;
  performedByUserId: string;
  approvedByUserId: string | null;
  notes: string | null;
  occurredAt: Date;
  createdAt: Date;
}

export const ensureMovementQuantity = (value: number): number => {
  if (value <= 0) {
    throw new Error("Movement quantity must be greater than zero");
  }

  return value;
};

export const ensureExpiredReleaseAuthorization = (params: {
  performedByRole: "admin" | "employee";
  reason: string;
  approvedByUserId: string | null;
}): void => {
  if (params.performedByRole !== "admin") {
    throw new Error("Only admin users can approve expired release");
  }

  if (!params.reason.trim()) {
    throw new Error("Expired release reason is required");
  }

  if (!params.approvedByUserId) {
    throw new Error("Expired release approval user is required");
  }
};
