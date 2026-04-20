export interface ApproveExpiredReleaseInput {
  productId: string;
  lotId: string;
  quantity: number;
  reason: string;
  performedByUserId: string;
  performedByRole: "admin" | "employee";
}
