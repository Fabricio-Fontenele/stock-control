import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().max(500).nullable().optional()
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const categoryIdParamSchema = z.object({
  categoryId: z.string().uuid()
});

export const supplierCreateSchema = z.object({
  name: z.string().trim().min(1),
  document: z.string().trim().max(100).nullable().optional(),
  contactName: z.string().trim().max(255).nullable().optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  email: z.string().trim().email().nullable().optional()
});

export const supplierUpdateSchema = supplierCreateSchema.partial();

export const supplierIdParamSchema = z.object({
  supplierId: z.string().uuid()
});
