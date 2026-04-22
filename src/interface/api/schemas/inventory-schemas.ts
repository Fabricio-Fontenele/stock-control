import { z } from "zod";

const exitReasonSchema = z.enum(["sale", "loss", "expiration", "breakage"]);
const entryReasonSchema = z.enum(["supplier-purchase", "restock"]);

export const inventoryEntrySchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  entryDate: z.coerce.date(),
  reasonType: entryReasonSchema,
  notes: z.string().max(500).nullable().optional()
});

export const inventoryExitSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  reasonType: exitReasonSchema,
  notes: z.string().max(500).nullable().optional()
});

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  direction: z.enum(["entrada", "saida"]),
  quantity: z.number().positive(),
  reason: z.string().min(5),
  lotId: z.string().uuid().nullable().optional()
});

export const expiredReleaseSchema = z.object({
  productId: z.string().uuid(),
  lotId: z.string().uuid(),
  quantity: z.number().positive(),
  reason: z.string().trim().min(5)
});

export const inventorySearchQuerySchema = z.object({
  search: z.string().trim().min(1).optional()
});

export type InventoryEntryRequest = z.infer<typeof inventoryEntrySchema>;
export type InventoryExitRequest = z.infer<typeof inventoryExitSchema>;
export type InventoryAdjustmentRequest = z.infer<typeof inventoryAdjustmentSchema>;
export type ExpiredReleaseRequest = z.infer<typeof expiredReleaseSchema>;
