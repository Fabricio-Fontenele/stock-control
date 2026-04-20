import { type StockMovement } from "../../domain/entities/stock-movement.js";
import type { TransactionContext } from "./unit-of-work.js";

export interface MovementFilter {
  from?: Date;
  to?: Date;
  productId?: string;
  movementType?: string;
  reasonType?: string;
}

export interface MovementViewRow {
  id: string;
  productId: string;
  lotId: string | null;
  movementType: string;
  reasonType: string;
  quantity: number;
  notes: string | null;
  occurredAt: Date;
  performedBy: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "employee";
  };
  approvedBy: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "employee";
  } | null;
}

export interface RejectedMovementAttempt {
  id: string;
  productId: string;
  requestedQuantity: number;
  reasonType: StockMovement["reasonType"];
  attemptedByUserId: string;
  attemptedAt: Date;
  failureReason: string;
  notes: string | null;
}

export interface MovementRepository {
  create(movement: StockMovement, tx?: TransactionContext): Promise<void>;
  createRejectedAttempt(attempt: RejectedMovementAttempt, tx?: TransactionContext): Promise<void>;
  listReport(filter?: MovementFilter): Promise<MovementViewRow[]>;
  list(filter?: MovementFilter): Promise<StockMovement[]>;
}
