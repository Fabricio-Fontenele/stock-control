import type { Supplier } from "../../domain/entities/supplier.js";
import type { SupplierRepository } from "../ports/supplier-repository.js";

interface ListSuppliersDependencies {
  supplierRepository: SupplierRepository;
}

export class ListSuppliersUseCase {
  constructor(private readonly deps: ListSuppliersDependencies) {}

  async execute(): Promise<Supplier[]> {
    return this.deps.supplierRepository.list();
  }
}
