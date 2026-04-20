import type { CategoryRepository } from "../ports/category-repository.js";
import type { SupplierRepository } from "../ports/supplier-repository.js";
import type { ProductRepository } from "../ports/product-repository.js";
import type { UpdateProductInput } from "../dto/product-management-dto.js";
import {
  ensureProductMinimumStock,
  ensureProductSku,
  ensureProductSkuReservation,
  type Product
} from "../../domain/entities/product.js";
import { HttpError } from "../errors/http-error.js";

interface UpdateProductDependencies {
  productRepository: ProductRepository;
  categoryRepository: CategoryRepository;
  supplierRepository: SupplierRepository;
}

export class UpdateProductUseCase {
  constructor(private readonly deps: UpdateProductDependencies) {}

  async execute(input: UpdateProductInput): Promise<Product> {
    const existing = await this.deps.productRepository.findById(input.productId);

    if (!existing) {
      throw new HttpError(404, "Product not found");
    }

    const nextSku = input.sku ? ensureProductSku(input.sku) : existing.sku;
    const [skuOwner, category, supplier] = await Promise.all([
      this.deps.productRepository.findBySku(nextSku),
      input.categoryId ? this.deps.categoryRepository.findById(input.categoryId) : Promise.resolve(null),
      input.supplierId ? this.deps.supplierRepository.findById(input.supplierId) : Promise.resolve(null)
    ]);

    try {
      ensureProductSkuReservation(skuOwner, existing.id);
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpError(409, error.message);
      }

      throw error;
    }

    if (input.categoryId && !category) {
      throw new HttpError(404, "Category not found");
    }

    if (input.supplierId && !supplier) {
      throw new HttpError(404, "Supplier not found");
    }

    const updated: Product = {
      ...existing,
      sku: nextSku,
      name: input.name?.trim() || existing.name,
      categoryId: input.categoryId ?? existing.categoryId,
      supplierId: input.supplierId ?? existing.supplierId,
      purchasePrice: input.purchasePrice ?? existing.purchasePrice,
      salePrice: input.salePrice ?? existing.salePrice,
      unitOfMeasure: input.unitOfMeasure?.trim() || existing.unitOfMeasure,
      minimumStock:
        input.minimumStock !== undefined
          ? ensureProductMinimumStock(input.minimumStock)
          : existing.minimumStock,
      tracksExpiration: input.tracksExpiration ?? existing.tracksExpiration,
      updatedAt: new Date()
    };

    await this.deps.productRepository.update(updated);
    return updated;
  }
}
