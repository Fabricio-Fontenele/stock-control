import { z } from "zod";

export const movementReportQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  productId: z.string().uuid().optional(),
  reasonType: z.string().optional()
});

export const dashboardAlertQuerySchema = z.object({
  referenceDate: z.coerce.date().optional()
});

export const dashboardAlertsResponseSchema = z.object({
  belowMinimum: z.array(
    z.object({
      id: z.string().uuid(),
      sku: z.string(),
      name: z.string(),
      status: z.enum(["active", "inactive"]),
      availableQuantity: z.number(),
      minimumStock: z.number(),
      belowMinimum: z.boolean(),
      expiringWithinDays: z.literal(15),
      hasExpiredLots: z.boolean()
    })
  ),
  expiringSoon: z.array(
    z.object({
      id: z.string().uuid(),
      sku: z.string(),
      name: z.string(),
      status: z.enum(["active", "inactive"]),
      availableQuantity: z.number(),
      minimumStock: z.number(),
      belowMinimum: z.boolean(),
      expiringWithinDays: z.literal(15),
      hasExpiredLots: z.boolean(),
      lots: z.array(
        z.object({
          id: z.string().uuid(),
          code: z.string(),
          receivedQuantity: z.number(),
          remainingQuantity: z.number(),
          entryDate: z.coerce.date(),
          expirationDate: z.coerce.date(),
          status: z.enum(["available", "depleted", "expired", "blocked"])
        })
      )
    })
  ),
  expired: z.array(
    z.object({
      id: z.string().uuid(),
      sku: z.string(),
      name: z.string(),
      status: z.enum(["active", "inactive"]),
      availableQuantity: z.number(),
      minimumStock: z.number(),
      belowMinimum: z.boolean(),
      expiringWithinDays: z.literal(15),
      hasExpiredLots: z.boolean(),
      lots: z.array(
        z.object({
          id: z.string().uuid(),
          code: z.string(),
          receivedQuantity: z.number(),
          remainingQuantity: z.number(),
          entryDate: z.coerce.date(),
          expirationDate: z.coerce.date(),
          status: z.enum(["available", "depleted", "expired", "blocked"])
        })
      )
    })
  )
});
