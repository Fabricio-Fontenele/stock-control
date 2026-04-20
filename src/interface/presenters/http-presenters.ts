import type { ProductStockSnapshotDto } from "../../application/dto/product-stock-snapshot.js";
import type { StockMovement } from "../../domain/entities/stock-movement.js";
import type { User } from "../../domain/entities/user.js";

export const presentAuthUser = (user: Pick<User, "id" | "name" | "email" | "role">) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

export const presentStockSnapshot = (snapshot: ProductStockSnapshotDto) => ({
  id: snapshot.productId,
  sku: snapshot.sku,
  name: snapshot.productName,
  status: snapshot.status,
  availableQuantity: snapshot.availableQuantity,
  minimumStock: snapshot.minimumStock,
  belowMinimum: snapshot.belowMinimum,
  expiringWithinDays: snapshot.expiringWithinDays,
  hasExpiredLots: snapshot.hasExpiredLots
});

export const presentMovement = (
  movement: StockMovement,
  performedBy: Pick<User, "id" | "name" | "email" | "role">,
  approvedBy?: Pick<User, "id" | "name" | "email" | "role"> | null
) => {
  const base = {
    id: movement.id,
    productId: movement.productId,
    lotId: movement.lotId,
    movementType: movement.movementType,
    reasonType: movement.reasonType,
    quantity: movement.quantity,
    performedBy: presentAuthUser(performedBy),
    notes: movement.notes,
    occurredAt: movement.occurredAt
  };

  if (!approvedBy) {
    return base;
  }

  return {
    ...base,
    approvedBy: presentAuthUser(approvedBy)
  };
};
