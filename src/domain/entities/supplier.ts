export type SupplierId = string;

export interface Supplier {
  id: SupplierId;
  name: string;
  document: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const ensureSupplierName = (value: string): string => {
  const name = value.trim();

  if (!name) {
    throw new Error("Supplier name is required");
  }

  return name;
};
