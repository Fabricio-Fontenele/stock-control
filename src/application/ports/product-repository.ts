import { type Product, type ProductId, type ProductSku } from "../../domain/entities/product.js";

export interface ProductFilter {
  query?: string;
  isActive?: boolean;
}

export interface ProductRepository {
  create(product: Product): Promise<void>;
  update(product: Product): Promise<void>;
  findById(id: ProductId): Promise<Product | null>;
  findBySku(sku: ProductSku): Promise<Product | null>;
  list(filter?: ProductFilter): Promise<Product[]>;
}
