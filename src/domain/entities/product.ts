export const PRODUCT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive"
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
export type ProductId = string;
export type ProductSku = string;

export interface Product {
  id: ProductId;
  sku: ProductSku;
  name: string;
  categoryId: string;
  supplierId: string;
  purchasePrice: number;
  salePrice: number;
  unitOfMeasure: string;
  minimumStock: number;
  tracksExpiration: boolean;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const ensureProductSku = (value: string): ProductSku => {
  const sku = value.trim().toUpperCase();

  if (!sku) {
    throw new Error("Product SKU is required");
  }

  return sku;
};

export const ensureProductMinimumStock = (value: number): number => {
  if (value < 0) {
    throw new Error("Minimum stock must be greater than or equal to zero");
  }

  return value;
};

export const isProductActive = (product: Product): boolean => {
  return product.status === PRODUCT_STATUS.ACTIVE;
};
