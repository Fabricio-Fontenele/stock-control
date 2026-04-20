import type { QueryResult, QueryResultRow } from "pg";

import { type StockMovement } from "../../domain/entities/stock-movement.js";
import type {
  MovementFilter,
  MovementViewRow,
  MovementRepository,
  RejectedMovementAttempt
} from "../../application/ports/movement-repository.js";
import type { TransactionContext } from "../../application/ports/unit-of-work.js";
import { getPostgresPool } from "../persistence/postgres/connection.js";

interface StockMovementRow {
  id: string;
  product_id: string;
  lot_id: string | null;
  movement_type: StockMovement["movementType"];
  reason_type: StockMovement["reasonType"];
  quantity: string;
  performed_by_user_id: string;
  approved_by_user_id: string | null;
  notes: string | null;
  occurred_at: Date;
  created_at: Date;
}

interface MovementReportRow {
  id: string;
  product_id: string;
  lot_id: string | null;
  movement_type: string;
  reason_type: string;
  quantity: string;
  notes: string | null;
  occurred_at: Date;
  performed_by_id: string;
  performed_by_name: string;
  performed_by_email: string;
  performed_by_role: "admin" | "employee";
  approved_by_id: string | null;
  approved_by_name: string | null;
  approved_by_email: string | null;
  approved_by_role: "admin" | "employee" | null;
}

const mapMovementRow = (row: StockMovementRow): StockMovement => ({
  id: row.id,
  productId: row.product_id,
  lotId: row.lot_id,
  movementType: row.movement_type,
  reasonType: row.reason_type,
  quantity: Number(row.quantity),
  performedByUserId: row.performed_by_user_id,
  approvedByUserId: row.approved_by_user_id,
  notes: row.notes,
  occurredAt: row.occurred_at,
  createdAt: row.created_at
});

export class PostgresMovementRepository implements MovementRepository {
  private readonly pool = getPostgresPool();

  private async query<T extends QueryResultRow>(
    sql: string,
    values: unknown[] = [],
    tx?: TransactionContext
  ): Promise<QueryResult<T>> {
    if (tx) {
      const result = await tx.query<T>(sql, values);
      return {
        rows: result.rows,
        rowCount: result.rowCount,
        command: "",
        oid: 0,
        fields: []
      } as QueryResult<T>;
    }

    return this.pool.query<T>(sql, values);
  }

  async create(movement: StockMovement, tx?: TransactionContext): Promise<void> {
    await this.query(
      `
      INSERT INTO stock_movements (
        id,
        product_id,
        lot_id,
        movement_type,
        reason_type,
        quantity,
        performed_by_user_id,
        approved_by_user_id,
        notes,
        occurred_at,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        movement.id,
        movement.productId,
        movement.lotId,
        movement.movementType,
        movement.reasonType,
        movement.quantity,
        movement.performedByUserId,
        movement.approvedByUserId,
        movement.notes,
        movement.occurredAt,
        movement.createdAt
      ],
      tx
    );
  }

  async createRejectedAttempt(attempt: RejectedMovementAttempt, tx?: TransactionContext): Promise<void> {
    await this.query(
      `
      INSERT INTO stock_rejected_movements (
        id,
        product_id,
        requested_quantity,
        reason_type,
        attempted_by_user_id,
        attempted_at,
        failure_reason,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        attempt.id,
        attempt.productId,
        attempt.requestedQuantity,
        attempt.reasonType,
        attempt.attemptedByUserId,
        attempt.attemptedAt,
        attempt.failureReason,
        attempt.notes
      ],
      tx
    );
  }

  async listReport(filter?: MovementFilter): Promise<MovementViewRow[]> {
    const values: unknown[] = [];
    const where: string[] = [];

    if (filter?.from) {
      values.push(filter.from);
      where.push(`m.occurred_at >= $${values.length}`);
    }

    if (filter?.to) {
      values.push(filter.to);
      where.push(`m.occurred_at <= $${values.length}`);
    }

    if (filter?.productId) {
      values.push(filter.productId);
      where.push(`m.product_id = $${values.length}`);
    }

    if (filter?.movementType) {
      values.push(filter.movementType);
      where.push(`m.movement_type = $${values.length}`);
    }

    if (filter?.reasonType) {
      values.push(filter.reasonType);
      where.push(`m.reason_type = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result: QueryResult<MovementReportRow> = await this.pool.query(
      `
      SELECT
        m.id,
        m.product_id,
        m.lot_id,
        m.movement_type,
        m.reason_type,
        m.quantity,
        m.notes,
        m.occurred_at,
        pu.id AS performed_by_id,
        pu.name AS performed_by_name,
        pu.email AS performed_by_email,
        pu.role AS performed_by_role,
        au.id AS approved_by_id,
        au.name AS approved_by_name,
        au.email AS approved_by_email,
        au.role AS approved_by_role
      FROM stock_movements m
      INNER JOIN users pu ON pu.id = m.performed_by_user_id
      LEFT JOIN users au ON au.id = m.approved_by_user_id
      ${whereSql}
      ORDER BY m.occurred_at DESC
      `,
      values
    );

    return result.rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      lotId: row.lot_id,
      movementType: row.movement_type,
      reasonType: row.reason_type,
      quantity: Number(row.quantity),
      notes: row.notes,
      occurredAt: row.occurred_at,
      performedBy: {
        id: row.performed_by_id,
        name: row.performed_by_name,
        email: row.performed_by_email,
        role: row.performed_by_role
      },
      approvedBy:
        row.approved_by_id && row.approved_by_name && row.approved_by_email && row.approved_by_role
          ? {
              id: row.approved_by_id,
              name: row.approved_by_name,
              email: row.approved_by_email,
              role: row.approved_by_role
            }
          : null
    }));
  }

  async list(filter?: MovementFilter): Promise<StockMovement[]> {
    const values: unknown[] = [];
    const where: string[] = [];

    if (filter?.from) {
      values.push(filter.from);
      where.push(`occurred_at >= $${values.length}`);
    }

    if (filter?.to) {
      values.push(filter.to);
      where.push(`occurred_at <= $${values.length}`);
    }

    if (filter?.productId) {
      values.push(filter.productId);
      where.push(`product_id = $${values.length}`);
    }

    if (filter?.movementType) {
      values.push(filter.movementType);
      where.push(`movement_type = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result: QueryResult<StockMovementRow> = await this.pool.query(
      `
      SELECT
        id,
        product_id,
        lot_id,
        movement_type,
        reason_type,
        quantity,
        performed_by_user_id,
        approved_by_user_id,
        notes,
        occurred_at,
        created_at
      FROM stock_movements
      ${whereSql}
      ORDER BY occurred_at DESC
      `,
      values
    );

    return result.rows.map(mapMovementRow);
  }
}
