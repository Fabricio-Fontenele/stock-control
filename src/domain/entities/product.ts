export const PRODUCT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive"
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
export type ProductId = string;
export type ProductSku = string;
const GENERATED_PRODUCT_SKU_PATTERN = /^(\d+)$/;

export interface Product {
  id: ProductId;
  sku: ProductSku;
  name: string;
  categoryId: string;
  supplierId: string | null;
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

export const buildGeneratedProductSku = (sequence: number): ProductSku => {
  if (!Number.isInteger(sequence) || sequence <= 0) {
    throw new Error("Product SKU sequence must be a positive integer");
  }

  return String(sequence).padStart(6, "0");
};

export const parseGeneratedProductSkuSequence = (value: string): number | null => {
  const sku = ensureProductSku(value);
  const match = GENERATED_PRODUCT_SKU_PATTERN.exec(sku);

  if (!match) {
    return null;
  }

  return Number(match[1]);
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

export const ensureProductSkuReservation = (
  existingProduct: Pick<Product, "id"> | null,
  currentProductId?: string
): void => {
  if (!existingProduct) {
    return;
  }

  if (currentProductId && existingProduct.id === currentProductId) {
    return;
  }

  throw new Error("Product SKU is already reserved");
};

export const ensureProductActiveForCommonOperation = (product: Pick<Product, "status">): void => {
  if (product.status !== PRODUCT_STATUS.ACTIVE) {
    throw new Error("Inactive product cannot be used in common operations");
  }
};
