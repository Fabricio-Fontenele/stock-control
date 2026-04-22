import { describe, expect, it, vi } from "vitest";

import { CreateCategoryUseCase } from "../../../src/application/use-cases/create-category.use-case.js";
import { UpdateCategoryUseCase } from "../../../src/application/use-cases/update-category.use-case.js";
import { ListCategoriesUseCase } from "../../../src/application/use-cases/list-categories.use-case.js";
import { CreateSupplierUseCase } from "../../../src/application/use-cases/create-supplier.use-case.js";
import { UpdateSupplierUseCase } from "../../../src/application/use-cases/update-supplier.use-case.js";
import { ListSuppliersUseCase } from "../../../src/application/use-cases/list-suppliers.use-case.js";
import type { CategoryRepository } from "../../../src/application/ports/category-repository.js";
import type { SupplierRepository } from "../../../src/application/ports/supplier-repository.js";

const createCategoryRepository = (): CategoryRepository => ({
  create: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue({
    id: "cat-1",
    name: "Categoria 1",
    description: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  findByName: vi.fn().mockResolvedValue(null),
  list: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(undefined)
});

const createSupplierRepository = (): SupplierRepository => ({
  create: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue({
    id: "sup-1",
    name: "Fornecedor 1",
    document: null,
    contactName: null,
    phone: null,
    email: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  findByName: vi.fn().mockResolvedValue(null),
  list: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(undefined)
});

describe("manage categories and suppliers use cases", () => {
  it("creates category", async () => {
    const repository = createCategoryRepository();
    const useCase = new CreateCategoryUseCase({
      categoryRepository: repository
    });

    const category = await useCase.execute({
      name: "Nova Categoria",
      description: "descricao"
    });

    expect(category.name).toBe("Nova Categoria");
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it("updates category", async () => {
    const repository = createCategoryRepository();
    const useCase = new UpdateCategoryUseCase({
      categoryRepository: repository
    });

    const category = await useCase.execute({
      categoryId: "cat-1",
      name: "Categoria Atualizada"
    });

    expect(category.name).toBe("Categoria Atualizada");
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it("lists categories", async () => {
    const repository = createCategoryRepository();
    const useCase = new ListCategoriesUseCase({
      categoryRepository: repository
    });

    await useCase.execute();
    expect(repository.list).toHaveBeenCalledTimes(1);
  });

  it("creates supplier", async () => {
    const repository = createSupplierRepository();
    const useCase = new CreateSupplierUseCase({
      supplierRepository: repository
    });

    const supplier = await useCase.execute({
      name: "Novo Fornecedor",
      document: "123",
      contactName: "Contato",
      phone: "9999",
      email: "fornecedor@example.com"
    });

    expect(supplier.name).toBe("Novo Fornecedor");
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it("updates supplier", async () => {
    const repository = createSupplierRepository();
    const useCase = new UpdateSupplierUseCase({
      supplierRepository: repository
    });

    const supplier = await useCase.execute({
      supplierId: "sup-1",
      phone: "8888"
    });

    expect(supplier.phone).toBe("8888");
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it("lists suppliers", async () => {
    const repository = createSupplierRepository();
    const useCase = new ListSuppliersUseCase({
      supplierRepository: repository
    });

    await useCase.execute();
    expect(repository.list).toHaveBeenCalledTimes(1);
  });
});
