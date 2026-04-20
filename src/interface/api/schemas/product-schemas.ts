import { z } from "zod";

export const productCreateSchema = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  categoryId: z.string().uuid(),
  supplierId: z.string().uuid(),
  purchasePrice: z.number().positive(),
  salePrice: z.number().positive(),
  unitOfMeasure: z.string().trim().min(1),
  minimumStock: z.number().nonnegative(),
  tracksExpiration: z.boolean()
});

export const productUpdateSchema = productCreateSchema.partial();

export const productListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.enum(["active", "inactive"]).optional()
});

export const productIdParamSchema = z.object({
  productId: z.string().uuid()
});
