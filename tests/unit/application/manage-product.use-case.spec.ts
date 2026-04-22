import { describe, expect, it, vi } from "vitest";

import { CreateProductUseCase } from "../../../src/application/use-cases/create-product.use-case.js";
import { UpdateProductUseCase } from "../../../src/application/use-cases/update-product.use-case.js";
import { ListProductsUseCase } from "../../../src/application/use-cases/list-products.use-case.js";
import { GetProductDetailUseCase } from "../../../src/application/use-cases/get-product-detail.use-case.js";
import { DeactivateProductUseCase } from "../../../src/application/use-cases/deactivate-product.use-case.js";
import { ReactivateProductUseCase } from "../../../src/application/use-cases/reactivate-product.use-case.js";
import type { ProductRepository } from "../../../src/application/ports/product-repository.js";
import type { CategoryRepository } from "../../../src/application/ports/category-repository.js";
import type { SupplierRepository } from "../../../src/application/ports/supplier-repository.js";
import type { StockRepository } from "../../../src/application/ports/stock-repository.js";
import { PRODUCT_STATUS, type Product } from "../../../src/domain/entities/product.js";
import { STOCK_LOT_STATUS, type StockLot } from "../../../src/domain/entities/stock-lot.js";

const createProduct = (overrides: Partial<Product> = {}): Product => ({
  id: overrides.id ?? "product-1",
  sku: overrides.sku ?? "SKU-1",
  name: overrides.name ?? "Produto 1",
  categoryId: overrides.categoryId ?? "cat-1",
  supplierId: overrides.supplierId !== undefined ? overrides.supplierId : "sup-1",
  purchasePrice: overrides.purchasePrice ?? 10,
  salePrice: overrides.salePrice ?? 20,
  unitOfMeasure: overrides.unitOfMeasure ?? "un",
  minimumStock: overrides.minimumStock ?? 2,
  tracksExpiration: overrides.tracksExpiration ?? true,
  status: overrides.status ?? PRODUCT_STATUS.ACTIVE,
  createdAt: overrides.createdAt ?? new Date("2026-01-01"),
  updatedAt: overrides.updatedAt ?? new Date("2026-01-01")
});

const createLot = (overrides: Partial<StockLot> = {}): StockLot => ({
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

const createProductRepository = (product = createProduct()): ProductRepository => ({
  create: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(product),
  findBySku: vi.fn().mockResolvedValue(null),
  previewNextGeneratedSku: vi.fn().mockResolvedValue("000001"),
  nextGeneratedSku: vi.fn().mockResolvedValue("000001"),
  syncGeneratedSkuSequence: vi.fn().mockResolvedValue(undefined),
  list: vi.fn().mockResolvedValue([product])
});

const createCategoryRepository = (): CategoryRepository => ({
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn().mockResolvedValue({
    id: "cat-1",
    name: "Categoria",
    description: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  findByName: vi.fn(),
  list: vi.fn(),
  delete: vi.fn()
});

const createSupplierRepository = (): SupplierRepository => ({
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn().mockResolvedValue({
    id: "sup-1",
    name: "Fornecedor",
    document: null,
    contactName: null,
    phone: null,
    email: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  findByName: vi.fn(),
  list: vi.fn(),
  delete: vi.fn()
});

const createStockRepository = (lots: StockLot[] = [createLot()]): StockRepository => ({
  createLot: vi.fn(),
  updateLot: vi.fn(),
  findLotsByProduct: vi.fn().mockResolvedValue(lots),
  findEligibleLotsByProduct: vi.fn(),
  searchProductStock: vi.fn(),
  findBelowMinimumProducts: vi.fn(),
  findExpiringLots: vi.fn(),
  findExpiredLots: vi.fn()
});

describe("manage product use cases", () => {
  it("creates product with custom SKU when references exist", async () => {
    const productRepository = createProductRepository();

    const useCase = new CreateProductUseCase({
      productRepository,
      categoryRepository: createCategoryRepository(),
      supplierRepository: createSupplierRepository()
    });

    const product = await useCase.execute({
      sku: "000111",
      name: "Novo Produto",
      categoryId: "cat-1",
      supplierId: "sup-1",
      purchasePrice: 5,
      salePrice: 10,
      unitOfMeasure: "un",
      minimumStock: 1,
      tracksExpiration: true
    });

    expect(product.sku).toBe("000111");
    expect(productRepository.create).toHaveBeenCalledTimes(1);
    expect(productRepository.syncGeneratedSkuSequence).toHaveBeenCalledWith("000111");
  });

  it("blocks SKU reuse when creating product", async () => {
    const productRepository = createProductRepository();
    (productRepository.findBySku as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      createProduct({ id: "existing" })
    );

    const useCase = new CreateProductUseCase({
      productRepository,
      categoryRepository: createCategoryRepository(),
      supplierRepository: createSupplierRepository()
    });

    await expect(
      useCase.execute({
        name: "Duplicado",
        categoryId: "cat-1",
        supplierId: "sup-1",
        purchasePrice: 5,
        salePrice: 10,
        unitOfMeasure: "un",
        minimumStock: 1,
        tracksExpiration: true
      })
    ).rejects.toThrow("Product SKU is already reserved");
  });

  it("updates product and preserves SKU ownership for same product", async () => {
    const product = createProduct();
    const productRepository = createProductRepository(product);
    (productRepository.findBySku as ReturnType<typeof vi.fn>).mockResolvedValueOnce(product);

    const useCase = new UpdateProductUseCase({
      productRepository,
      categoryRepository: createCategoryRepository(),
      supplierRepository: createSupplierRepository()
    });

    const updated = await useCase.execute({
      productId: product.id,
      sku: product.sku,
      name: "Produto Atualizado",
      minimumStock: 5
    });

    expect(updated.name).toBe("Produto Atualizado");
    expect(updated.minimumStock).toBe(5);
    expect(productRepository.update).toHaveBeenCalledTimes(1);
  });

  it("updates product SKU when a new one is provided", async () => {
    const product = createProduct({ sku: "000001" });
    const productRepository = createProductRepository(product);
    (productRepository.findBySku as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const useCase = new UpdateProductUseCase({
      productRepository,
      categoryRepository: createCategoryRepository(),
      supplierRepository: createSupplierRepository()
    });

    const updated = await useCase.execute({
      productId: product.id,
      sku: "000321"
    });

    expect(updated.sku).toBe("000321");
    expect(productRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ sku: "000321" })
    );
    expect(productRepository.syncGeneratedSkuSequence).toHaveBeenCalledWith("000321");
  });

  it("creates product without supplier", async () => {
    const productRepository = createProductRepository();

    const useCase = new CreateProductUseCase({
      productRepository,
      categoryRepository: createCategoryRepository(),
      supplierRepository: createSupplierRepository()
    });

    const product = await useCase.execute({
      name: "Sem Fornecedor",
      categoryId: "cat-1",
      supplierId: null,
      purchasePrice: 5,
      salePrice: 10,
      unitOfMeasure: "un",
      minimumStock: 1,
      tracksExpiration: true
    });

    expect(product.supplierId).toBeNull();
  });

  it("generates SKU when one is not provided", async () => {
    const productRepository = createProductRepository();

    const useCase = new CreateProductUseCase({
      productRepository,
      categoryRepository: createCategoryRepository(),
      supplierRepository: createSupplierRepository()
    });

    const product = await useCase.execute({
      name: "Gerado",
      categoryId: "cat-1",
      supplierId: null,
      purchasePrice: 5,
      salePrice: 10,
      unitOfMeasure: "un",
      minimumStock: 1,
      tracksExpiration: true
    });

    expect(product.sku).toBe("000001");
    expect(productRepository.nextGeneratedSku).toHaveBeenCalledTimes(1);
    expect(productRepository.syncGeneratedSkuSequence).toHaveBeenCalledWith("000001");
  });

  it("lists products with derived stock view", async () => {
    const useCase = new ListProductsUseCase({
      productRepository: createProductRepository(),
      stockRepository: createStockRepository([
        createLot({ remainingQuantity: 3, expirationDate: new Date("2030-01-10") }),
        createLot({ id: "lot-2", remainingQuantity: 0, status: STOCK_LOT_STATUS.DEPLETED })
      ])
    });

    const items = await useCase.execute({ status: "active" });

    expect(items).toHaveLength(1);
    expect(items[0]?.availableQuantity).toBe(3);
    expect(items[0]?.belowMinimum).toBe(false);
  });

  it("deactivates active product", async () => {
    const productRepository = createProductRepository(createProduct());

    const useCase = new DeactivateProductUseCase({
      productRepository
    });

    const updated = await useCase.execute("product-1");

    expect(updated.status).toBe(PRODUCT_STATUS.INACTIVE);
    expect(productRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: PRODUCT_STATUS.INACTIVE })
    );
  });

  it("reactivates inactive product", async () => {
    const productRepository = createProductRepository(
      createProduct({ status: PRODUCT_STATUS.INACTIVE })
    );

    const useCase = new ReactivateProductUseCase({
      productRepository
    });

    const updated = await useCase.execute("product-1");

    expect(updated.status).toBe(PRODUCT_STATUS.ACTIVE);
    expect(productRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: PRODUCT_STATUS.ACTIVE })
    );
  });

  it("returns product detail with lot statuses", async () => {
    const useCase = new GetProductDetailUseCase({
      productRepository: createProductRepository(),
      stockRepository: createStockRepository([
        createLot({ id: "expired", expirationDate: new Date("2020-01-01"), remainingQuantity: 2 })
      ])
    });

    const detail = await useCase.execute("product-1");

    expect(detail.lots[0]?.status).toBe("expired");
    expect(detail.hasExpiredLots).toBe(true);
  });

  it("deactivates active product", async () => {
    const productRepository = createProductRepository();
    const useCase = new DeactivateProductUseCase({
      productRepository
    });

    const updated = await useCase.execute("product-1");

    expect(updated.status).toBe(PRODUCT_STATUS.INACTIVE);
    expect(productRepository.update).toHaveBeenCalledTimes(1);
  });
});
