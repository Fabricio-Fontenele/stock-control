import { type Supplier, type SupplierId } from "../../domain/entities/supplier.js";

export interface SupplierRepository {
  create(supplier: Supplier): Promise<void>;
  update(supplier: Supplier): Promise<void>;
  findById(id: SupplierId): Promise<Supplier | null>;
  findByName(name: string): Promise<Supplier | null>;
  list(): Promise<Supplier[]>;
}
