export interface RegisterInventoryAdjustmentInput {
  productId: string;
  direction: "entrada" | "saida";
  quantity: number;
  reason: string;
  lotId: string | null;
  performedByUserId: string;
  performedByRole: "admin" | "employee";
}
