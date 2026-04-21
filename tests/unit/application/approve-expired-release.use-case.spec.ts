import { describe, expect, it, vi } from "vitest";

import { ApproveExpiredReleaseUseCase } from "../../../src/application/use-cases/approve-expired-release.use-case.js";
import type { ProductRepository } from "../../../src/application/ports/product-repository.js";
import type { StockRepository } from "../../../src/application/ports/stock-repository.js";
import type { MovementRepository } from "../../../src/application/ports/movement-repository.js";
import type { UnitOfWork } from "../../../src/application/ports/unit-of-work.js";
import { PRODUCT_STATUS } from "../../../src/domain/entities/product.js";
import { STOCK_LOT_STATUS, type StockLot } from "../../../src/domain/entities/stock-lot.js";

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
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  findBySku: vi.fn(),
  previewNextGeneratedSku: vi.fn().mockResolvedValue("000001"),
  nextGeneratedSku: vi.fn().mockResolvedValue("000001"),
  syncGeneratedSkuSequence: vi.fn(),
  list: vi.fn()
});

const createLot = (overrides: Partial<StockLot> = {}): StockLot => ({
  id: overrides.id ?? "lot-1",
  productId: overrides.productId ?? "product-1",
  code: overrides.code ?? "LOT-1",
  receivedQuantity: overrides.receivedQuantity ?? 10,
  remainingQuantity: overrides.remainingQuantity ?? 10,
  entryDate: overrides.entryDate ?? new Date("2026-01-01"),
  expirationDate: overrides.expirationDate ?? new Date("2020-01-01"),
  status: overrides.status ?? STOCK_LOT_STATUS.EXPIRED,
  createdAt: overrides.createdAt ?? new Date("2026-01-01"),
  updatedAt: overrides.updatedAt ?? new Date("2026-01-01")
});

const createStockRepository = (lots: StockLot[]): StockRepository => ({
  createLot: vi.fn(),
  updateLot: vi.fn().mockResolvedValue(undefined),
  findLotsByProduct: vi.fn().mockResolvedValue(lots),
  findEligibleLotsByProduct: vi.fn(),
  searchProductStock: vi.fn(),
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

describe("ApproveExpiredReleaseUseCase", () => {
  it("allows admin to release expired lot and records movement", async () => {
    const movementRepository = createMovementRepository();
    const stockRepository = createStockRepository([createLot()]);

    const useCase = new ApproveExpiredReleaseUseCase({
      productRepository: createProductRepository(),
      stockRepository,
      movementRepository,
      unitOfWork: createUnitOfWork()
    });

    const movement = await useCase.execute({
      productId: "product-1",
      lotId: "lot-1",
      quantity: 2,
      reason: "Liberacao excepcional",
      performedByUserId: "admin-1",
      performedByRole: "admin"
    });

    expect(movement.movementType).toBe("expired-release");
    expect(movementRepository.create).toHaveBeenCalledTimes(1);
    expect(stockRepository.updateLot).toHaveBeenCalledTimes(1);
  });

  it("blocks non-admin expired release", async () => {
    const useCase = new ApproveExpiredReleaseUseCase({
      productRepository: createProductRepository(),
      stockRepository: createStockRepository([createLot()]),
      movementRepository: createMovementRepository(),
      unitOfWork: createUnitOfWork()
    });

    await expect(
      useCase.execute({
        productId: "product-1",
        lotId: "lot-1",
        quantity: 1,
        reason: "Tentativa indevida",
        performedByUserId: "employee-1",
        performedByRole: "employee"
      })
    ).rejects.toThrow("Only admin users can approve expired release");
  });

  it("blocks non-expired lot", async () => {
    const useCase = new ApproveExpiredReleaseUseCase({
      productRepository: createProductRepository(),
      stockRepository: createStockRepository([
        createLot({ expirationDate: new Date("2030-01-01"), status: STOCK_LOT_STATUS.AVAILABLE })
      ]),
      movementRepository: createMovementRepository(),
      unitOfWork: createUnitOfWork()
    });

    await expect(
      useCase.execute({
        productId: "product-1",
        lotId: "lot-1",
        quantity: 1,
        reason: "Lote nao vencido",
        performedByUserId: "admin-1",
        performedByRole: "admin"
      })
    ).rejects.toThrow("Only expired lots can be released exceptionally");
  });
});
