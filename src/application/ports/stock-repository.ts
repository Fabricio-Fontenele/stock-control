import { type StockLot } from "../../domain/entities/stock-lot.js";
import type { TransactionContext } from "./unit-of-work.js";

export interface ProductStockSnapshot {
  productId: string;
  sku: string;
  productName: string;
  status: "active" | "inactive";
  availableQuantity: number;
  minimumStock: number;
  isBelowMinimum: boolean;
  nextExpirationDate: Date | null;
  hasExpiredLots: boolean;
  hasExpiringLots: boolean;
}

export interface ProductLotAlert {
  productId: string;
  sku: string;
  productName: string;
  status: "active" | "inactive";
  availableQuantity: number;
  minimumStock: number;
  isBelowMinimum: boolean;
  lotId: string;
  lotCode: string;
  lotReceivedQuantity: number;
  lotRemainingQuantity: number;
  lotEntryDate: Date;
  lotExpirationDate: Date;
  lotStatus: "available" | "depleted" | "expired" | "blocked";
}

export interface StockRepository {
  createLot(lot: StockLot, tx?: TransactionContext): Promise<void>;
  updateLot(lot: StockLot, tx?: TransactionContext): Promise<void>;
  findLotsByProduct(productId: string, tx?: TransactionContext): Promise<StockLot[]>;
  findEligibleLotsByProduct(productId: string, asOf: Date): Promise<StockLot[]>;
  searchProductStock(query: string, referenceDate?: Date): Promise<ProductStockSnapshot[]>;
  findBelowMinimumProducts(referenceDate: Date): Promise<ProductStockSnapshot[]>;
  findExpiringLots(referenceDate: Date, windowDays: number): Promise<ProductLotAlert[]>;
  findExpiredLots(referenceDate: Date): Promise<ProductLotAlert[]>;
}
