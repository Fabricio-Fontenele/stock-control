import type { ProductDetailDto } from "../dto/product-management-dto.js";
import { buildProductDetail } from "../dto/product-management-dto.js";
import { HttpError } from "../errors/http-error.js";
import type { ProductRepository } from "../ports/product-repository.js";
import type { StockRepository } from "../ports/stock-repository.js";

interface GetProductDetailDependencies {
  productRepository: ProductRepository;
  stockRepository: StockRepository;
}

export class GetProductDetailUseCase {
  constructor(private readonly deps: GetProductDetailDependencies) {}

  async execute(productId: string): Promise<ProductDetailDto> {
    const product = await this.deps.productRepository.findById(productId);

    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    const lots = await this.deps.stockRepository.findLotsByProduct(productId);
    return buildProductDetail(product, lots);
  }
}
