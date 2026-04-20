export interface CreateCategoryInput {
  name: string;
  description: string | null;
}

export interface UpdateCategoryInput {
  categoryId: string;
  name?: string;
  description?: string | null;
}

export interface CreateSupplierInput {
  name: string;
  document: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
}

export interface UpdateSupplierInput {
  supplierId: string;
  name?: string;
  document?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
}
