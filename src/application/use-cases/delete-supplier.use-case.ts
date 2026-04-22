import type { SupplierRepository } from "../ports/supplier-repository.js";
import type { SupplierId } from "../../domain/entities/supplier.js";
import { HttpError } from "../errors/http-error.js";

interface DeleteSupplierDependencies {
  supplierRepository: SupplierRepository;
}

export class DeleteSupplierUseCase {
  constructor(private readonly deps: DeleteSupplierDependencies) {}

  async execute(supplierId: SupplierId): Promise<void> {
    const exists = await this.deps.supplierRepository.findById(supplierId);

    if (!exists) {
      throw new HttpError(404, "Fornecedor nao encontrado");
    }

    try {
      await this.deps.supplierRepository.delete(supplierId);
    } catch (error) {
      if (error instanceof Error && error.message.includes("violates foreign key")) {
        throw new HttpError(409, "Fornecedor esta vinculado a produtos e nao pode ser excluido");
      }
      throw error;
    }
  }
}