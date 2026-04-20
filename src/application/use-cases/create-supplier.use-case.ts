import { randomUUID } from "node:crypto";

import { ensureSupplierName, type Supplier } from "../../domain/entities/supplier.js";
import { HttpError } from "../errors/http-error.js";
import type { CreateSupplierInput } from "../dto/category-supplier-dto.js";
import type { SupplierRepository } from "../ports/supplier-repository.js";

interface CreateSupplierDependencies {
  supplierRepository: SupplierRepository;
}

export class CreateSupplierUseCase {
  constructor(private readonly deps: CreateSupplierDependencies) {}

  async execute(input: CreateSupplierInput): Promise<Supplier> {
    const name = ensureSupplierName(input.name);
    const existing = await this.deps.supplierRepository.findByName(name);

    if (existing) {
      throw new HttpError(409, "Supplier name is already reserved");
    }

    const now = new Date();
    const supplier: Supplier = {
      id: randomUUID(),
      name,
      document: input.document?.trim() || null,
      contactName: input.contactName?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      createdAt: now,
      updatedAt: now
    };

    await this.deps.supplierRepository.create(supplier);
    return supplier;
  }
}
