import type { ListProductsInput, ProductListItemDto } from "../dto/product-management-dto.js";
import type { ProductRepository } from "../ports/product-repository.js";
import type { StockRepository } from "../ports/stock-repository.js";
import { buildProductListItem } from "../dto/product-management-dto.js";

interface ListProductsDependencies {
  productRepository: ProductRepository;
  stockRepository: StockRepository;
}

export class ListProductsUseCase {
  constructor(private readonly deps: ListProductsDependencies) {}

  async execute(input: ListProductsInput = {}): Promise<ProductListItemDto[]> {
    const filter: {
      query?: string;
      isActive?: boolean;
    } = {};

    if (input.search !== undefined) {
      filter.query = input.search;
    }

    if (input.status !== undefined) {
      filter.isActive = input.status === "active";
    }

    const products = await this.deps.productRepository.list(filter);

    return Promise.all(
      products.map(async (product) => {
        const lots = await this.deps.stockRepository.findLotsByProduct(product.id);
        return buildProductListItem(product, lots);
      })
    );
  }
}
