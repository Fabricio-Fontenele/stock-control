import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegisterInventoryAdjustmentUseCase } from "../../../src/application/use-cases/register-inventory-adjustment.use-case.js";
import type { ProductRepository } from "../../../src/application/ports/product-repository.js";
import type { StockRepository } from "../../../src/application/ports/stock-repository.js";
import type { MovementRepository } from "../../../src/application/ports/movement-repository.js";
import type { UnitOfWork } from "../../../src/application/ports/unit-of-work.js";

const productRepository: ProductRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn().mockResolvedValue({
    id: "p1",
    sku: "SKU-1",
    name: "Produto",
    categoryId: "c1",
    supplierId: "s1",
    purchasePrice: 1,
    salePrice: 2,
    unitOfMeasure: "un",
    minimumStock: 1,
    tracksExpiration: false,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  findBySku: vi.fn(),
  list: vi.fn()
};

const stockRepository: StockRepository = {
  createLot: vi.fn().mockResolvedValue(undefined),
  updateLot: vi.fn().mockResolvedValue(undefined),
  findLotsByProduct: vi.fn().mockResolvedValue([
    {
      id: "lot-1",
      productId: "p1",
      code: "LOT-1",
      receivedQuantity: 5,
      remainingQuantity: 5,
      entryDate: new Date(),
      expirationDate: null,
      status: "available",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]),
  findEligibleLotsByProduct: vi.fn(),
  searchProductStock: vi.fn(),
  findBelowMinimumProducts: vi.fn(),
  findExpiringLots: vi.fn(),
  findExpiredLots: vi.fn()
};

const movementRepository: MovementRepository = {
  create: vi.fn().mockResolvedValue(undefined),
  createRejectedAttempt: vi.fn(),
  listReport: vi.fn(),
  list: vi.fn()
};

const unitOfWork: UnitOfWork = {
  runInTransaction: async (operation) =>
    operation({
      query: vi.fn(async () => ({ rows: [], rowCount: 0 }))
    })
};

describe("RegisterInventoryAdjustmentUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks non-admin users", async () => {
    const useCase = new RegisterInventoryAdjustmentUseCase({
      productRepository,
      stockRepository,
      movementRepository,
      unitOfWork
    });

    await expect(
      useCase.execute({
        productId: "p1",
        direction: "entrada",
        quantity: 1,
        reason: "teste",
        lotId: null,
        performedByUserId: "u1",
        performedByRole: "employee"
      })
    ).rejects.toThrow("Only admin users can register inventory adjustments");
  });

  it("blocks exit adjustment when stock is insufficient", async () => {
    (stockRepository.findLotsByProduct as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: "lot-1",
        productId: "p1",
        code: "LOT-1",
        receivedQuantity: 1,
        remainingQuantity: 1,
        entryDate: new Date(),
        expirationDate: null,
        status: "available",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const useCase = new RegisterInventoryAdjustmentUseCase({
      productRepository,
      stockRepository,
      movementRepository,
      unitOfWork
    });

    await expect(
      useCase.execute({
        productId: "p1",
        direction: "saida",
        quantity: 3,
        reason: "ajuste saida",
        lotId: null,
        performedByUserId: "admin-1",
        performedByRole: "admin"
      })
    ).rejects.toThrow("Insufficient stock for inventory adjustment exit");
  });

  it("requires a non-empty adjustment reason", async () => {
    const useCase = new RegisterInventoryAdjustmentUseCase({
      productRepository,
      stockRepository,
      movementRepository,
      unitOfWork
    });

    await expect(
      useCase.execute({
        productId: "p1",
        direction: "entrada",
        quantity: 1,
        reason: "   ",
        lotId: null,
        performedByUserId: "admin-1",
        performedByRole: "admin"
      })
    ).rejects.toThrow("Adjustment reason is required");
  });

  it("registers exit adjustment when balance is sufficient", async () => {
    const useCase = new RegisterInventoryAdjustmentUseCase({
      productRepository,
      stockRepository,
      movementRepository,
      unitOfWork
    });

    const movement = await useCase.execute({
      productId: "p1",
      direction: "saida",
      quantity: 2,
      reason: "Ajuste de retirada",
      lotId: null,
      performedByUserId: "admin-1",
      performedByRole: "admin"
    });

    expect(movement.movementType).toBe("exit");
    expect(movement.reasonType).toBe("inventory-adjustment");
    expect(movement.quantity).toBe(2);
  });
});
