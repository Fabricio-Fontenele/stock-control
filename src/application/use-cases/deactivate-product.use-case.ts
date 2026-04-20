import { PRODUCT_STATUS, type Product } from "../../domain/entities/product.js";
import { HttpError } from "../errors/http-error.js";
import type { ProductRepository } from "../ports/product-repository.js";

interface DeactivateProductDependencies {
  productRepository: ProductRepository;
}

export class DeactivateProductUseCase {
  constructor(private readonly deps: DeactivateProductDependencies) {}

  async execute(productId: string): Promise<Product> {
    const product = await this.deps.productRepository.findById(productId);

    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    if (product.status === PRODUCT_STATUS.INACTIVE) {
      return product;
    }

    const updated: Product = {
      ...product,
      status: PRODUCT_STATUS.INACTIVE,
      updatedAt: new Date()
    };

    await this.deps.productRepository.update(updated);
    return updated;
  }
}
