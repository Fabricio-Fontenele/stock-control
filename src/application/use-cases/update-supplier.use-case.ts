import { ensureSupplierName, type Supplier } from "../../domain/entities/supplier.js";
import { HttpError } from "../errors/http-error.js";
import type { UpdateSupplierInput } from "../dto/category-supplier-dto.js";
import type { SupplierRepository } from "../ports/supplier-repository.js";

interface UpdateSupplierDependencies {
  supplierRepository: SupplierRepository;
}

export class UpdateSupplierUseCase {
  constructor(private readonly deps: UpdateSupplierDependencies) {}

  async execute(input: UpdateSupplierInput): Promise<Supplier> {
    const existing = await this.deps.supplierRepository.findById(input.supplierId);

    if (!existing) {
      throw new HttpError(404, "Supplier not found");
    }

    const name = input.name ? ensureSupplierName(input.name) : existing.name;
    const owner = await this.deps.supplierRepository.findByName(name);

    if (owner && owner.id !== existing.id) {
      throw new HttpError(409, "Supplier name is already reserved");
    }

    const updated: Supplier = {
      ...existing,
      name,
      document: input.document === undefined ? existing.document : input.document?.trim() || null,
      contactName:
        input.contactName === undefined ? existing.contactName : input.contactName?.trim() || null,
      phone: input.phone === undefined ? existing.phone : input.phone?.trim() || null,
      email: input.email === undefined ? existing.email : input.email?.trim() || null,
      updatedAt: new Date()
    };

    await this.deps.supplierRepository.update(updated);
    return updated;
  }
}
