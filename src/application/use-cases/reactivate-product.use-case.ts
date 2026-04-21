import { PRODUCT_STATUS, type Product } from "../../domain/entities/product.js";
import { HttpError } from "../errors/http-error.js";
import type { ProductRepository } from "../ports/product-repository.js";

interface ReactivateProductDependencies {
  productRepository: ProductRepository;
}

export class ReactivateProductUseCase {
  constructor(private readonly deps: ReactivateProductDependencies) {}

  async execute(productId: string): Promise<Product> {
    const product = await this.deps.productRepository.findById(productId);

    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    if (product.status === PRODUCT_STATUS.ACTIVE) {
      return product;
    }

    const updated: Product = {
      ...product,
      status: PRODUCT_STATUS.ACTIVE,
      updatedAt: new Date()
    };

    await this.deps.productRepository.update(updated);
    return updated;
  }
}
