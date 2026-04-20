import type { ProductStockSnapshotDto } from "../../application/dto/product-stock-snapshot.js";
import type {
  ProductDetailDto,
  ProductListItemDto
} from "../../application/dto/product-management-dto.js";
import type { Category } from "../../domain/entities/category.js";
import type { StockMovement } from "../../domain/entities/stock-movement.js";
import type { Product } from "../../domain/entities/product.js";
import type { Supplier } from "../../domain/entities/supplier.js";
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

export const presentProduct = (
  product: Product | ProductListItemDto
) => ({
  id: product.id,
  sku: product.sku,
  name: product.name,
  categoryId: product.categoryId,
  supplierId: product.supplierId,
  purchasePrice: product.purchasePrice,
  salePrice: product.salePrice,
  unitOfMeasure: product.unitOfMeasure,
  minimumStock: product.minimumStock,
  tracksExpiration: product.tracksExpiration,
  status: product.status,
  availableQuantity: "availableQuantity" in product ? product.availableQuantity : undefined,
  belowMinimum: "belowMinimum" in product ? product.belowMinimum : undefined,
  expiringWithinDays: "expiringWithinDays" in product ? product.expiringWithinDays : undefined,
  hasExpiredLots: "hasExpiredLots" in product ? product.hasExpiredLots : undefined
});

export const presentProductDetail = (product: ProductDetailDto) => ({
  ...presentProduct(product),
  lots: product.lots
});

export const presentCategory = (category: Category) => ({
  id: category.id,
  name: category.name,
  description: category.description
});

export const presentSupplier = (supplier: Supplier) => ({
  id: supplier.id,
  name: supplier.name,
  document: supplier.document,
  contactName: supplier.contactName,
  phone: supplier.phone,
  email: supplier.email
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
