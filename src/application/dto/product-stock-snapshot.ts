export interface ProductStockSnapshotDto {
  productId: string;
  sku: string;
  productName: string;
  unitOfMeasure: string;
  salePrice: number;
  updatedAt: Date;
  status: "active" | "inactive";
  availableQuantity: number;
  minimumStock: number;
  belowMinimum: boolean;
  nextExpirationDate: Date | null;
  expiringWithinDays: 15;
  hasExpiredLots: boolean;
}
