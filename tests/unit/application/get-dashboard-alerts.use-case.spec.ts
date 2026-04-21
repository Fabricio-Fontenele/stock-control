import { describe, expect, it, vi } from "vitest";

import { GetDashboardAlertsUseCase } from "../../../src/application/use-cases/get-dashboard-alerts.use-case.js";
import type { StockRepository } from "../../../src/application/ports/stock-repository.js";

const createStockRepository = (): StockRepository => ({
  createLot: vi.fn(),
  updateLot: vi.fn(),
  findLotsByProduct: vi.fn(),
  findEligibleLotsByProduct: vi.fn(),
  searchProductStock: vi.fn().mockResolvedValue([]),
  findBelowMinimumProducts: vi.fn().mockResolvedValue([
    {
      productId: "p1",
      sku: "SKU-1",
      productName: "Produto 1",
      unitOfMeasure: "un",
      salePrice: 2,
      updatedAt: new Date("2026-01-05T10:00:00.000Z"),
      status: "active",
      availableQuantity: 4,
      minimumStock: 10,
      isBelowMinimum: true,
      nextExpirationDate: new Date("2026-01-10"),
      hasExpiredLots: true,
      hasExpiringLots: true
    },
    {
      productId: "p2",
      sku: "SKU-2",
      productName: "Produto 2",
      unitOfMeasure: "un",
      salePrice: 3,
      updatedAt: new Date("2026-01-04T10:00:00.000Z"),
      status: "active",
      availableQuantity: 1,
      minimumStock: 5,
      isBelowMinimum: true,
      nextExpirationDate: null,
      hasExpiredLots: false,
      hasExpiringLots: false
    }
  ]),
  findExpiringLots: vi.fn().mockResolvedValue([
    {
      productId: "p1",
      sku: "SKU-1",
      productName: "Produto 1",
      status: "active",
      availableQuantity: 4,
      minimumStock: 10,
      isBelowMinimum: true,
      lotId: "lot-soon",
      lotCode: "LOT-SOON",
      lotReceivedQuantity: 4,
      lotRemainingQuantity: 4,
      lotEntryDate: new Date("2026-01-01"),
      lotExpirationDate: new Date("2026-01-10"),
      lotStatus: "available"
    }
  ]),
  findExpiredLots: vi.fn().mockResolvedValue([
    {
      productId: "p1",
      sku: "SKU-1",
      productName: "Produto 1",
      status: "active",
      availableQuantity: 4,
      minimumStock: 10,
      isBelowMinimum: true,
      lotId: "lot-expired",
      lotCode: "LOT-EXPIRED",
      lotReceivedQuantity: 2,
      lotRemainingQuantity: 2,
      lotEntryDate: new Date("2025-12-01"),
      lotExpirationDate: new Date("2026-01-01"),
      lotStatus: "expired"
    }
  ])
});

describe("GetDashboardAlertsUseCase", () => {
  it("aggregates below minimum, expiring and expired sections", async () => {
    const stockRepository = createStockRepository();
    const useCase = new GetDashboardAlertsUseCase({ stockRepository });

    const output = await useCase.execute(new Date("2026-01-05"));

    expect(output.belowMinimum).toHaveLength(2);
    expect(output.expiringSoon).toHaveLength(1);
    expect(output.expired).toHaveLength(1);
    expect(output.expiringSoon[0]?.lots[0]?.code).toBe("LOT-SOON");
    expect(output.expired[0]?.lots[0]?.code).toBe("LOT-EXPIRED");
  });
});
