import type { StockRepository } from "../ports/stock-repository.js";
import type { ProductStockSnapshotDto } from "../dto/product-stock-snapshot.js";

interface SearchStockDependencies {
  stockRepository: StockRepository;
}

export class SearchStockUseCase {
  constructor(private readonly deps: SearchStockDependencies) {}

  async execute(query: string): Promise<ProductStockSnapshotDto[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const snapshots = await this.deps.stockRepository.searchProductStock(normalizedQuery);
    return snapshots.map((snapshot) => ({
      productId: snapshot.productId,
      sku: snapshot.sku,
      productName: snapshot.productName,
      status: snapshot.status,
      availableQuantity: snapshot.availableQuantity,
      minimumStock: snapshot.minimumStock,
      belowMinimum: snapshot.isBelowMinimum,
      nextExpirationDate: snapshot.nextExpirationDate,
      expiringWithinDays: 15 as const,
      hasExpiredLots: snapshot.hasExpiredLots
    }));
  }
}
