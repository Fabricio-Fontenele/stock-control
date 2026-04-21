import { describe, expect, it, vi } from "vitest";

import { RegisterStockEntryUseCase } from "../../../src/application/use-cases/register-stock-entry.use-case.js";
import type { ProductRepository } from "../../../src/application/ports/product-repository.js";
import type { StockRepository } from "../../../src/application/ports/stock-repository.js";
import type { MovementRepository } from "../../../src/application/ports/movement-repository.js";
import type { UnitOfWork } from "../../../src/application/ports/unit-of-work.js";

const createProductRepository = (): ProductRepository => ({
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn().mockResolvedValue({
    id: "product-1",
    sku: "SKU-1",
    name: "Produto 1",
    categoryId: "cat-1",
    supplierId: "sup-1",
    purchasePrice: 1,
    salePrice: 2,
    unitOfMeasure: "un",
    minimumStock: 1,
    tracksExpiration: true,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  findBySku: vi.fn(),
  previewNextGeneratedSku: vi.fn().mockResolvedValue("000001"),
  nextGeneratedSku: vi.fn().mockResolvedValue("000001"),
  syncGeneratedSkuSequence: vi.fn(),
  list: vi.fn()
});

const createStockRepository = (): StockRepository => ({
  createLot: vi.fn().mockResolvedValue(undefined),
  updateLot: vi.fn(),
  findLotsByProduct: vi.fn(),
  findEligibleLotsByProduct: vi.fn(),
  searchProductStock: vi.fn().mockResolvedValue([]),
  findBelowMinimumProducts: vi.fn(),
  findExpiringLots: vi.fn(),
  findExpiredLots: vi.fn()
});

const createMovementRepository = (): MovementRepository => ({
  create: vi.fn().mockResolvedValue(undefined),
  createRejectedAttempt: vi.fn(),
  listReport: vi.fn(),
  list: vi.fn()
});

const createUnitOfWork = (): UnitOfWork => ({
  runInTransaction: async (operation) =>
    operation({
      query: vi.fn(async () => ({ rows: [], rowCount: 0 }))
    })
});

describe("RegisterStockEntryUseCase", () => {
  it("registers entry for admin with lot and movement", async () => {
    const stockRepository = createStockRepository();
    const movementRepository = createMovementRepository();

    const useCase = new RegisterStockEntryUseCase({
      productRepository: createProductRepository(),
      stockRepository,
      movementRepository,
      unitOfWork: createUnitOfWork()
    });

    const movement = await useCase.execute({
      productId: "product-1",
      lotCode: "LOT-ENTRY-1",
      quantity: 5,
      entryDate: new Date(),
      expirationDate: new Date(Date.now() + 86400000),
      reasonType: "supplier-purchase",
      notes: null,
      performedByUserId: "admin-1",
      performedByRole: "admin"
    });

    expect(movement.movementType).toBe("entry");
    expect(stockRepository.createLot).toHaveBeenCalledTimes(1);
    expect(movementRepository.create).toHaveBeenCalledTimes(1);
  });

  it("accepts missing lot code and generates one automatically", async () => {
    const stockRepository = createStockRepository();

    const useCase = new RegisterStockEntryUseCase({
      productRepository: createProductRepository(),
      stockRepository,
      movementRepository: createMovementRepository(),
      unitOfWork: createUnitOfWork()
    });

    await useCase.execute({
      productId: "product-1",
      lotCode: null,
      quantity: 2,
      entryDate: new Date(),
      expirationDate: new Date(Date.now() + 86400000),
      reasonType: "supplier-purchase",
      notes: null,
      performedByUserId: "admin-1",
      performedByRole: "admin"
    });

    expect(stockRepository.createLot).toHaveBeenCalledTimes(1);
  });

  it("blocks employee from inventory entry", async () => {
    const useCase = new RegisterStockEntryUseCase({
      productRepository: createProductRepository(),
      stockRepository: createStockRepository(),
      movementRepository: createMovementRepository(),
      unitOfWork: createUnitOfWork()
    });

    await expect(
      useCase.execute({
        productId: "product-1",
        lotCode: "LOT-ENTRY-2",
        quantity: 5,
        entryDate: new Date(),
        expirationDate: new Date(Date.now() + 86400000),
        reasonType: "supplier-purchase",
        notes: null,
        performedByUserId: "employee-1",
        performedByRole: "employee"
      })
    ).rejects.toThrow("Only admin users can register inventory entries");
  });

  it("returns validation error when expiration date is required and missing", async () => {
    const useCase = new RegisterStockEntryUseCase({
      productRepository: createProductRepository(),
      stockRepository: createStockRepository(),
      movementRepository: createMovementRepository(),
      unitOfWork: createUnitOfWork()
    });

    await expect(
      useCase.execute({
        productId: "product-1",
        lotCode: "LOT-ENTRY-3",
        quantity: 3,
        entryDate: new Date(),
        expirationDate: null,
        reasonType: "supplier-purchase",
        notes: null,
        performedByUserId: "admin-1",
        performedByRole: "admin"
      })
    ).rejects.toThrow("Expiration date is required for products that track expiration");
  });
});
