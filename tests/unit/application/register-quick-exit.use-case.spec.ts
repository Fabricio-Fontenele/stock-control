import { describe, expect, it, vi } from "vitest";

import { RegisterQuickExitUseCase } from "../../../src/application/use-cases/register-quick-exit.use-case.js";
import type { ProductRepository } from "../../../src/application/ports/product-repository.js";
import type { StockRepository } from "../../../src/application/ports/stock-repository.js";
import type { MovementRepository } from "../../../src/application/ports/movement-repository.js";
import type { UnitOfWork } from "../../../src/application/ports/unit-of-work.js";
import { STOCK_LOT_STATUS, type StockLot } from "../../../src/domain/entities/stock-lot.js";
import { PRODUCT_STATUS } from "../../../src/domain/entities/product.js";

const createProductRepository = (): ProductRepository => ({
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn().mockResolvedValue({
    id: "product-1",
    sku: "SKU-1",
    name: "Product 1",
    categoryId: "cat-1",
    supplierId: "sup-1",
    purchasePrice: 1,
    salePrice: 2,
    unitOfMeasure: "un",
    minimumStock: 1,
    tracksExpiration: true,
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01")
  }),
  findBySku: vi.fn(),
  list: vi.fn()
});

const createStockLot = (overrides: Partial<StockLot>): StockLot => ({
  id: overrides.id ?? "lot-1",
  productId: overrides.productId ?? "product-1",
  code: overrides.code ?? "LOT-1",
  receivedQuantity: overrides.receivedQuantity ?? 10,
  remainingQuantity: overrides.remainingQuantity ?? 10,
  entryDate: overrides.entryDate ?? new Date("2026-01-01"),
  expirationDate: overrides.expirationDate ?? new Date("2026-12-31"),
  status: overrides.status ?? STOCK_LOT_STATUS.AVAILABLE,
  createdAt: overrides.createdAt ?? new Date("2026-01-01"),
  updatedAt: overrides.updatedAt ?? new Date("2026-01-01")
});

const createStockRepository = (lots: StockLot[]): StockRepository => ({
  createLot: vi.fn(),
  updateLot: vi.fn().mockResolvedValue(undefined),
  findLotsByProduct: vi.fn().mockResolvedValue(lots),
  findEligibleLotsByProduct: vi.fn(),
  searchProductStock: vi.fn().mockResolvedValue([]),
  findBelowMinimumProducts: vi.fn(),
  findExpiringLots: vi.fn(),
  findExpiredLots: vi.fn()
});

const createMovementRepository = (): MovementRepository => ({
  create: vi.fn().mockResolvedValue(undefined),
  createRejectedAttempt: vi.fn().mockResolvedValue(undefined),
  listReport: vi.fn(),
  list: vi.fn()
});

const createUnitOfWork = (): UnitOfWork => ({
  runInTransaction: async (operation) => {
    const tx = {
      query: vi.fn(async () => ({ rows: [], rowCount: 0 }))
    };

    return operation(tx);
  }
});

describe("RegisterQuickExitUseCase", () => {
  it("registers FEFO exit and persists movement", async () => {
    const lots = [
      createStockLot({ id: "late", expirationDate: new Date("2030-06-01") }),
      createStockLot({ id: "soon", expirationDate: new Date("2030-03-01") })
    ];

    const productRepository = createProductRepository();
    const stockRepository = createStockRepository(lots);
    const movementRepository = createMovementRepository();
    const useCase = new RegisterQuickExitUseCase({
      productRepository,
      stockRepository,
      movementRepository,
      unitOfWork: createUnitOfWork()
    });

    const result = await useCase.execute({
      productId: "product-1",
      quantity: 2,
      reasonType: "sale",
      notes: null,
      performedByUserId: "user-1",
      performedByRole: "employee"
    });

    expect(result.movements).toHaveLength(1);
    expect(result.movements[0]?.lotId).toBe("soon");
    expect(movementRepository.create).toHaveBeenCalledTimes(1);
    expect(movementRepository.createRejectedAttempt).not.toHaveBeenCalled();
  });

  it("records rejected attempt when stock is insufficient", async () => {
    const lots = [createStockLot({ id: "only", remainingQuantity: 1 })];

    const useCase = new RegisterQuickExitUseCase({
      productRepository: createProductRepository(),
      stockRepository: createStockRepository(lots),
      movementRepository: createMovementRepository(),
      unitOfWork: createUnitOfWork()
    });

    await expect(
      useCase.execute({
        productId: "product-1",
        quantity: 5,
        reasonType: "sale",
        notes: "too much",
        performedByUserId: "user-1",
        performedByRole: "employee"
      })
    ).rejects.toThrow("Insufficient available stock or no eligible lot for exit");
  });

  it("records rejected attempt when product does not exist", async () => {
    const productRepository = createProductRepository();
    (productRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const movementRepository = createMovementRepository();
    const useCase = new RegisterQuickExitUseCase({
      productRepository,
      stockRepository: createStockRepository([]),
      movementRepository,
      unitOfWork: createUnitOfWork()
    });

    await expect(
      useCase.execute({
        productId: "missing-product",
        quantity: 1,
        reasonType: "sale",
        notes: null,
        performedByUserId: "user-1",
        performedByRole: "employee"
      })
    ).rejects.toThrow("Product not found");

    expect(movementRepository.createRejectedAttempt).toHaveBeenCalledTimes(1);
  });

  it("records rejected attempt when quantity is not positive", async () => {
    const movementRepository = createMovementRepository();
    const useCase = new RegisterQuickExitUseCase({
      productRepository: createProductRepository(),
      stockRepository: createStockRepository([]),
      movementRepository,
      unitOfWork: createUnitOfWork()
    });

    await expect(
      useCase.execute({
        productId: "product-1",
        quantity: 0,
        reasonType: "sale",
        notes: null,
        performedByUserId: "user-1",
        performedByRole: "employee"
      })
    ).rejects.toThrow("Exit quantity must be greater than zero");

    expect(movementRepository.createRejectedAttempt).toHaveBeenCalledTimes(1);
  });

  it("returns internal error when rejected-attempt audit cannot be persisted", async () => {
    const movementRepository = createMovementRepository();
    (movementRepository.createRejectedAttempt as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("audit write failed")
    );

    const useCase = new RegisterQuickExitUseCase({
      productRepository: createProductRepository(),
      stockRepository: createStockRepository([]),
      movementRepository,
      unitOfWork: createUnitOfWork()
    });

    await expect(
      useCase.execute({
        productId: "product-1",
        quantity: 0,
        reasonType: "sale",
        notes: null,
        performedByUserId: "user-1",
        performedByRole: "employee"
      })
    ).rejects.toThrow("Failed to persist rejected movement audit trail");
  });

  it("does not map infrastructure failures to business conflict", async () => {
    const useCase = new RegisterQuickExitUseCase({
      productRepository: createProductRepository(),
      stockRepository: createStockRepository([createStockLot({ id: "lot-1" })]),
      movementRepository: createMovementRepository(),
      unitOfWork: {
        runInTransaction: async () => {
          throw new Error("db unavailable");
        }
      }
    });

    await expect(
      useCase.execute({
        productId: "product-1",
        quantity: 1,
        reasonType: "sale",
        notes: null,
        performedByUserId: "user-1",
        performedByRole: "employee"
      })
    ).rejects.toThrow("db unavailable");
  });
});
