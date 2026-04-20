export interface RegisterStockEntryInput {
  productId: string;
  lotCode: string | null;
  quantity: number;
  entryDate: Date;
  expirationDate: Date | null;
  reasonType: "supplier-purchase" | "restock" | "inventory-adjustment";
  notes: string | null;
  performedByUserId: string;
  performedByRole: "admin" | "employee";
}

export interface DashboardAlertsDto {
  belowMinimum: Array<{
    id: string;
    sku: string;
    name: string;
    status: "active" | "inactive";
    availableQuantity: number;
    minimumStock: number;
    belowMinimum: boolean;
    expiringWithinDays: 15;
    hasExpiredLots: boolean;
  }>;
  expiringSoon: Array<{
    id: string;
    sku: string;
    name: string;
    status: "active" | "inactive";
    availableQuantity: number;
    minimumStock: number;
    belowMinimum: boolean;
    expiringWithinDays: 15;
    hasExpiredLots: boolean;
    lots: Array<{
      id: string;
      code: string;
      receivedQuantity: number;
      remainingQuantity: number;
      entryDate: Date;
      expirationDate: Date;
      status: "available" | "depleted" | "expired" | "blocked";
    }>;
  }>;
  expired: Array<{
    id: string;
    sku: string;
    name: string;
    status: "active" | "inactive";
    availableQuantity: number;
    minimumStock: number;
    belowMinimum: boolean;
    expiringWithinDays: 15;
    hasExpiredLots: boolean;
    lots: Array<{
      id: string;
      code: string;
      receivedQuantity: number;
      remainingQuantity: number;
      entryDate: Date;
      expirationDate: Date;
      status: "available" | "depleted" | "expired" | "blocked";
    }>;
  }>;
}
