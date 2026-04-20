import { randomUUID } from "node:crypto";

import type { CategoryRepository } from "../ports/category-repository.js";
import type { SupplierRepository } from "../ports/supplier-repository.js";
import type { ProductRepository } from "../ports/product-repository.js";
import type { CreateProductInput } from "../dto/product-management-dto.js";
import {
  PRODUCT_STATUS,
  ensureProductMinimumStock,
  ensureProductSku,
  ensureProductSkuReservation,
  type Product
} from "../../domain/entities/product.js";
import { HttpError } from "../errors/http-error.js";

interface CreateProductDependencies {
  productRepository: ProductRepository;
  categoryRepository: CategoryRepository;
  supplierRepository: SupplierRepository;
}

export class CreateProductUseCase {
  constructor(private readonly deps: CreateProductDependencies) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const sku = ensureProductSku(input.sku);

    const [existingProduct, category, supplier] = await Promise.all([
      this.deps.productRepository.findBySku(sku),
      this.deps.categoryRepository.findById(input.categoryId),
      this.deps.supplierRepository.findById(input.supplierId)
    ]);

    try {
      ensureProductSkuReservation(existingProduct);
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpError(409, error.message);
      }

      throw error;
    }

    if (!category) {
      throw new HttpError(404, "Category not found");
    }

    if (!supplier) {
      throw new HttpError(404, "Supplier not found");
    }

    const now = new Date();
    const product: Product = {
      id: randomUUID(),
      sku,
      name: input.name.trim(),
      categoryId: input.categoryId,
      supplierId: input.supplierId,
      purchasePrice: input.purchasePrice,
      salePrice: input.salePrice,
      unitOfMeasure: input.unitOfMeasure.trim(),
      minimumStock: ensureProductMinimumStock(input.minimumStock),
      tracksExpiration: input.tracksExpiration,
      status: PRODUCT_STATUS.ACTIVE,
      createdAt: now,
      updatedAt: now
    };

    await this.deps.productRepository.create(product);
    return product;
  }
}
