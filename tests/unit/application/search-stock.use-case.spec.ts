import { describe, expect, it, vi } from "vitest";

import { SearchStockUseCase } from "../../../src/application/use-cases/search-stock.use-case.js";
import type { StockRepository } from "../../../src/application/ports/stock-repository.js";

describe("SearchStockUseCase", () => {
  it("maps repository snapshot to API-ready DTO shape", async () => {
    const stockRepository: StockRepository = {
      createLot: vi.fn(),
      updateLot: vi.fn(),
      findLotsByProduct: vi.fn(),
      findEligibleLotsByProduct: vi.fn(),
      findBelowMinimumProducts: vi.fn(),
      findExpiringLots: vi.fn(),
      findExpiredLots: vi.fn(),
      searchProductStock: vi.fn().mockResolvedValue([
        {
          productId: "p1",
          sku: "SKU-1",
          productName: "Product 1",
          unitOfMeasure: "un",
          salePrice: 4.5,
          updatedAt: new Date("2026-05-01T10:00:00.000Z"),
          status: "active",
          availableQuantity: 20,
          minimumStock: 5,
          isBelowMinimum: false,
          nextExpirationDate: new Date("2026-05-10"),
          hasExpiredLots: false,
          hasExpiringLots: true
        }
      ])
    };

    const useCase = new SearchStockUseCase({ stockRepository });
    const result = await useCase.execute("SKU-1");

    expect(result).toEqual([
      {
        productId: "p1",
        sku: "SKU-1",
        productName: "Product 1",
        unitOfMeasure: "un",
        salePrice: 4.5,
        updatedAt: new Date("2026-05-01T10:00:00.000Z"),
        status: "active",
        availableQuantity: 20,
        minimumStock: 5,
        belowMinimum: false,
        nextExpirationDate: new Date("2026-05-10"),
        expiringWithinDays: 15,
        hasExpiredLots: false
      }
    ]);
    expect(stockRepository.searchProductStock).toHaveBeenCalledWith("SKU-1");
  });

  it("lists stock even without a search term", async () => {
    const stockRepository: StockRepository = {
      createLot: vi.fn(),
      updateLot: vi.fn(),
      findLotsByProduct: vi.fn(),
      findEligibleLotsByProduct: vi.fn(),
      findBelowMinimumProducts: vi.fn(),
      findExpiringLots: vi.fn(),
      findExpiredLots: vi.fn(),
      searchProductStock: vi.fn().mockResolvedValue([])
    };

    const useCase = new SearchStockUseCase({ stockRepository });
    await useCase.execute();

    expect(stockRepository.searchProductStock).toHaveBeenCalledWith(undefined);
  });
});
