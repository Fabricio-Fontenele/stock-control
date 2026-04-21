export interface ProductStockView {
  id: string;
  sku: string;
  name: string;
  unitOfMeasure: string;
  salePrice: number;
  updatedAt: string;
  status: "active" | "inactive";
  availableQuantity: number;
  minimumStock: number;
  belowMinimum: boolean;
  expiringWithinDays: 15;
  hasExpiredLots: boolean;
}

export interface LotView {
  id: string;
  code: string;
  receivedQuantity: number;
  remainingQuantity: number;
  entryDate: string;
  expirationDate: string | null;
  status: "available" | "depleted" | "expired" | "blocked";
}

export interface ProductDetailView extends ProductStockView {
  lots: LotView[];
}

export interface DashboardAlertsView {
  belowMinimum: ProductStockView[];
  expiringSoon: ProductDetailView[];
  expired: ProductDetailView[];
}

export interface CategoryView {
  id: string;
  name: string;
  description: string | null;
}

export interface SupplierView {
  id: string;
  name: string;
  document: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
}

export interface ProductView {
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
  availableQuantity?: number;
  belowMinimum?: boolean;
  expiringWithinDays?: 15;
  hasExpiredLots?: boolean;
}

export interface NextProductSkuView {
  sku: string;
}

export interface UserView {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
}

export interface MovementView {
  id: string;
  productId: string;
  lotId: string | null;
  movementType: string;
  reasonType: string;
  quantity: number;
  notes: string | null;
  occurredAt: string;
  performedBy: UserView;
  approvedBy?: UserView;
}

export interface ExitResponse extends MovementView {
  movements: MovementView[];
}
