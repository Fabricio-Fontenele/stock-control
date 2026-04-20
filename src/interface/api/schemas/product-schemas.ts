import { z } from "zod";

export const productCreateSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().uuid(),
  supplierId: z.string().uuid(),
  purchasePrice: z.number().positive(),
  salePrice: z.number().positive(),
  unitOfMeasure: z.string().min(1),
  minimumStock: z.number().nonnegative(),
  tracksExpiration: z.boolean()
});

export const productUpdateSchema = productCreateSchema.partial();
