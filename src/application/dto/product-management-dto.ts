import type { StockLot } from "../../domain/entities/stock-lot.js";
import type { Product } from "../../domain/entities/product.js";
import { EXPIRING_WINDOW_DAYS, isLotExpired } from "../../domain/policies/expiration-policy.js";

export interface ProductListItemDto {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  supplierId: string | null;
  purchasePrice: number;
  salePrice: number;
  unitOfMeasure: string;
  minimumStock: number;
  tracksExpiration: boolean;
  status: "active" | "inactive";
  availableQuantity: number;
  belowMinimum: boolean;
  expiringWithinDays: 15;
  hasExpiredLots: boolean;
}

export interface ProductDetailDto extends ProductListItemDto {
  lots: Array<{
    id: string;
    code: string;
    receivedQuantity: number;
    remainingQuantity: number;
    entryDate: Date;
    expirationDate: Date | null;
    status: "available" | "depleted" | "expired" | "blocked";
  }>;
}

export interface CreateProductInput {
  sku?: string;
  name: string;
  categoryId: string;
  supplierId: string | null;
  purchasePrice: number;
  salePrice: number;
  unitOfMeasure: string;
  minimumStock: number;
  tracksExpiration: boolean;
}

export interface UpdateProductInput {
  productId: string;
  sku?: string;
  name?: string;
  categoryId?: string;
  supplierId?: string | null;
  purchasePrice?: number;
  salePrice?: number;
  unitOfMeasure?: string;
  minimumStock?: number;
  tracksExpiration?: boolean;
}

export interface ListProductsInput {
  search?: string;
  status?: "active" | "inactive";
}

const deriveAvailableQuantity = (lots: StockLot[], referenceDate: Date): number => {
  return lots.reduce((sum, lot) => {
    if (lot.remainingQuantity <= 0 || lot.status === "blocked" || isLotExpired(lot, referenceDate)) {
      return sum;
    }

    return sum + lot.remainingQuantity;
  }, 0);
};

const deriveLotViewStatus = (
  lot: StockLot,
  referenceDate: Date
): "available" | "depleted" | "expired" | "blocked" => {
  if (lot.status === "blocked") {
    return "blocked";
  }

  if (lot.remainingQuantity <= 0) {
    return "depleted";
  }

  if (isLotExpired(lot, referenceDate)) {
    return "expired";
  }

  return "available";
};

export const buildProductListItem = (
  product: Product,
  lots: StockLot[],
  referenceDate: Date = new Date()
): ProductListItemDto => {
  const availableQuantity = deriveAvailableQuantity(lots, referenceDate);
  const hasExpiredLots = lots.some((lot) => isLotExpired(lot, referenceDate));

  return {
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
    availableQuantity,
    belowMinimum: availableQuantity < product.minimumStock,
    expiringWithinDays: EXPIRING_WINDOW_DAYS,
    hasExpiredLots
  };
};

export const buildProductDetail = (
  product: Product,
  lots: StockLot[],
  referenceDate: Date = new Date()
): ProductDetailDto => {
  const base = buildProductListItem(product, lots, referenceDate);

  return {
    ...base,
    lots: lots.map((lot) => ({
      id: lot.id,
      code: lot.code,
      receivedQuantity: lot.receivedQuantity,
      remainingQuantity: lot.remainingQuantity,
      entryDate: lot.entryDate,
      expirationDate: lot.expirationDate,
      status: deriveLotViewStatus(lot, referenceDate)
    }))
  };
};
