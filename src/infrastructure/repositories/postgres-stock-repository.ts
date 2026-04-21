import type { QueryResult, QueryResultRow } from "pg";

import { STOCK_LOT_STATUS, type StockLot } from "../../domain/entities/stock-lot.js";
import { EXPIRING_WINDOW_DAYS } from "../../domain/policies/expiration-policy.js";
import type {
  ProductLotAlert,
  ProductStockSnapshot,
  StockRepository
} from "../../application/ports/stock-repository.js";
import type { TransactionContext } from "../../application/ports/unit-of-work.js";
import { getPostgresPool } from "../persistence/postgres/connection.js";

interface StockLotRow {
  id: string;
  product_id: string;
  code: string;
  received_quantity: string;
  remaining_quantity: string;
  entry_date: Date;
  expiration_date: Date | null;
  status: "available" | "depleted" | "expired" | "blocked";
  created_at: Date;
  updated_at: Date;
}

interface SnapshotRow {
  product_id: string;
  sku: string;
  product_name: string;
  unit_of_measure: string;
  sale_price: string;
  updated_at: Date;
  status: "active" | "inactive";
  minimum_stock: string;
  available_quantity: string;
  next_expiration_date: Date | null;
  expired_lot_count: string;
  expiring_lot_count: string;
}

interface AlertLotRow {
  product_id: string;
  sku: string;
  product_name: string;
  status: "active" | "inactive";
  minimum_stock: string;
  available_quantity: string;
  lot_id: string;
  lot_code: string;
  lot_received_quantity: string;
  lot_remaining_quantity: string;
  lot_entry_date: Date;
  lot_expiration_date: Date;
  lot_status: "available" | "depleted" | "expired" | "blocked";
}

const mapLot = (row: StockLotRow): StockLot => ({
  id: row.id,
  productId: row.product_id,
  code: row.code,
  receivedQuantity: Number(row.received_quantity),
  remainingQuantity: Number(row.remaining_quantity),
  entryDate: row.entry_date,
  expirationDate: row.expiration_date,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapAlertRow = (row: AlertLotRow): ProductLotAlert => {
  const availableQuantity = Number(row.available_quantity);
  const minimumStock = Number(row.minimum_stock);

  return {
    productId: row.product_id,
    sku: row.sku,
    productName: row.product_name,
    status: row.status,
    availableQuantity,
    minimumStock,
    isBelowMinimum: availableQuantity < minimumStock,
    lotId: row.lot_id,
    lotCode: row.lot_code,
    lotReceivedQuantity: Number(row.lot_received_quantity),
    lotRemainingQuantity: Number(row.lot_remaining_quantity),
    lotEntryDate: row.lot_entry_date,
    lotExpirationDate: row.lot_expiration_date,
    lotStatus: row.lot_status
  };
};

export class PostgresStockRepository implements StockRepository {
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

  async createLot(lot: StockLot, tx?: TransactionContext): Promise<void> {
    await this.query(
      `
      INSERT INTO stock_lots (
        id,
        product_id,
        code,
        received_quantity,
        remaining_quantity,
        entry_date,
        expiration_date,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        lot.id,
        lot.productId,
        lot.code,
        lot.receivedQuantity,
        lot.remainingQuantity,
        lot.entryDate,
        lot.expirationDate,
        lot.status,
        lot.createdAt,
        lot.updatedAt
      ],
      tx
    );
  }

  async updateLot(lot: StockLot, tx?: TransactionContext): Promise<void> {
    const status = lot.remainingQuantity === 0 ? STOCK_LOT_STATUS.DEPLETED : lot.status;

    await this.query(
      `
      UPDATE stock_lots
      SET
        remaining_quantity = $2,
        status = $3,
        updated_at = $4
      WHERE id = $1
      `,
      [lot.id, lot.remainingQuantity, status, lot.updatedAt],
      tx
    );
  }

  async findLotsByProduct(productId: string, tx?: TransactionContext): Promise<StockLot[]> {
    const lockSql = tx ? "FOR UPDATE" : "";

    const result: QueryResult<StockLotRow> = await this.query(
      `
      SELECT
        id,
        product_id,
        code,
        received_quantity,
        remaining_quantity,
        entry_date,
        expiration_date,
        status,
        created_at,
        updated_at
      FROM stock_lots
      WHERE product_id = $1
      ORDER BY COALESCE(expiration_date, DATE '9999-12-31') ASC, entry_date ASC
      ${lockSql}
      `,
      [productId],
      tx
    );

    return result.rows.map(mapLot);
  }

  async findEligibleLotsByProduct(productId: string, asOf: Date): Promise<StockLot[]> {
    const result: QueryResult<StockLotRow> = await this.query(
      `
      SELECT
        id,
        product_id,
        code,
        received_quantity,
        remaining_quantity,
        entry_date,
        expiration_date,
        status,
        created_at,
        updated_at
      FROM stock_lots
      WHERE
        product_id = $1
        AND remaining_quantity > 0
        AND status <> 'blocked'
        AND (expiration_date IS NULL OR expiration_date >= $2::date)
      ORDER BY COALESCE(expiration_date, DATE '9999-12-31') ASC, entry_date ASC
      `,
      [productId, asOf]
    );

    return result.rows.map(mapLot);
  }

  async searchProductStock(query?: string, referenceDate: Date = new Date()): Promise<ProductStockSnapshot[]> {
    const normalizedQuery = query?.trim();
    const term = normalizedQuery ? `%${normalizedQuery}%` : null;

    const result: QueryResult<SnapshotRow> = await this.query(
      `
      WITH lot_rollup AS (
        SELECT
          l.product_id,
          COALESCE(SUM(
            CASE
              WHEN l.remaining_quantity > 0
                AND (l.expiration_date IS NULL OR l.expiration_date >= $2::date)
                AND l.status <> 'blocked'
              THEN l.remaining_quantity
              ELSE 0
            END
          ), 0) AS available_quantity,
          MIN(l.expiration_date) FILTER (
            WHERE l.expiration_date IS NOT NULL AND l.expiration_date >= $2::date
          ) AS next_expiration_date,
          COUNT(*) FILTER (WHERE l.expiration_date IS NOT NULL AND l.expiration_date < $2::date)
            AS expired_lot_count,
          COUNT(*) FILTER (
            WHERE l.expiration_date IS NOT NULL
              AND l.expiration_date >= $2::date
              AND l.expiration_date <= $2::date + ($3::int * INTERVAL '1 day')
          ) AS expiring_lot_count
        FROM stock_lots l
        GROUP BY l.product_id
      )
      SELECT
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        p.unit_of_measure,
        p.sale_price,
        p.updated_at,
        p.status,
        p.minimum_stock,
        COALESCE(lr.available_quantity, 0) AS available_quantity,
        lr.next_expiration_date,
        COALESCE(lr.expired_lot_count, 0) AS expired_lot_count,
        COALESCE(lr.expiring_lot_count, 0) AS expiring_lot_count
      FROM products p
      LEFT JOIN lot_rollup lr ON lr.product_id = p.id
      WHERE p.status = 'active'
        AND ($1::text IS NULL OR p.sku ILIKE $1 OR p.name ILIKE $1)
      ORDER BY p.name ASC
      `,
      [term, referenceDate, EXPIRING_WINDOW_DAYS]
    );

    return result.rows.map((row) => {
      const availableQuantity = Number(row.available_quantity);
      const minimumStock = Number(row.minimum_stock);

      return {
        productId: row.product_id,
        sku: row.sku,
        productName: row.product_name,
        unitOfMeasure: row.unit_of_measure,
        salePrice: Number(row.sale_price),
        updatedAt: row.updated_at,
        status: row.status,
        availableQuantity,
        minimumStock,
        isBelowMinimum: availableQuantity < minimumStock,
        nextExpirationDate: row.next_expiration_date,
        hasExpiredLots: Number(row.expired_lot_count) > 0,
        hasExpiringLots: Number(row.expiring_lot_count) > 0
      };
    });
  }

  async findBelowMinimumProducts(referenceDate: Date): Promise<ProductStockSnapshot[]> {
    const result: QueryResult<SnapshotRow> = await this.query(
      `
      WITH lot_rollup AS (
        SELECT
          l.product_id,
          COALESCE(SUM(
            CASE
              WHEN l.remaining_quantity > 0
                AND (l.expiration_date IS NULL OR l.expiration_date >= $1::date)
                AND l.status <> 'blocked'
              THEN l.remaining_quantity
              ELSE 0
            END
          ), 0) AS available_quantity,
          MIN(l.expiration_date) FILTER (
            WHERE l.expiration_date IS NOT NULL AND l.expiration_date >= $1::date
          ) AS next_expiration_date,
          COUNT(*) FILTER (WHERE l.expiration_date IS NOT NULL AND l.expiration_date < $1::date)
            AS expired_lot_count,
          COUNT(*) FILTER (
            WHERE l.expiration_date IS NOT NULL
              AND l.expiration_date >= $1::date
              AND l.expiration_date <= $1::date + ($2::int * INTERVAL '1 day')
          ) AS expiring_lot_count
        FROM stock_lots l
        GROUP BY l.product_id
      )
      SELECT
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        p.unit_of_measure,
        p.sale_price,
        p.updated_at,
        p.status,
        p.minimum_stock,
        COALESCE(lr.available_quantity, 0) AS available_quantity,
        lr.next_expiration_date,
        COALESCE(lr.expired_lot_count, 0) AS expired_lot_count,
        COALESCE(lr.expiring_lot_count, 0) AS expiring_lot_count
      FROM products p
      LEFT JOIN lot_rollup lr ON lr.product_id = p.id
      WHERE p.status = 'active'
        AND COALESCE(lr.available_quantity, 0) < p.minimum_stock
      ORDER BY p.name ASC
      `,
      [referenceDate, EXPIRING_WINDOW_DAYS]
    );

    return result.rows.map((row) => ({
      productId: row.product_id,
      sku: row.sku,
      productName: row.product_name,
      unitOfMeasure: row.unit_of_measure,
      salePrice: Number(row.sale_price),
      updatedAt: row.updated_at,
      status: row.status,
      availableQuantity: Number(row.available_quantity),
      minimumStock: Number(row.minimum_stock),
      isBelowMinimum: Number(row.available_quantity) < Number(row.minimum_stock),
      nextExpirationDate: row.next_expiration_date,
      hasExpiredLots: Number(row.expired_lot_count) > 0,
      hasExpiringLots: Number(row.expiring_lot_count) > 0
    }));
  }

  async findExpiringLots(referenceDate: Date, windowDays: number): Promise<ProductLotAlert[]> {
    const result: QueryResult<AlertLotRow> = await this.query(
      `
      WITH stock_summary AS (
        SELECT
          product_id,
          COALESCE(SUM(
            CASE
              WHEN remaining_quantity > 0
                AND (expiration_date IS NULL OR expiration_date >= $1::date)
                AND status <> 'blocked'
              THEN remaining_quantity
              ELSE 0
            END
          ), 0) AS available_quantity
        FROM stock_lots
        GROUP BY product_id
      )
      SELECT
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        p.status,
        p.minimum_stock,
        COALESCE(ss.available_quantity, 0) AS available_quantity,
        l.id AS lot_id,
        l.code AS lot_code,
        l.received_quantity AS lot_received_quantity,
        l.remaining_quantity AS lot_remaining_quantity,
        l.entry_date AS lot_entry_date,
        l.expiration_date AS lot_expiration_date,
        l.status AS lot_status
      FROM stock_lots l
      INNER JOIN products p ON p.id = l.product_id
      LEFT JOIN stock_summary ss ON ss.product_id = p.id
      WHERE
        p.status = 'active'
        AND l.expiration_date IS NOT NULL
        AND l.remaining_quantity > 0
        AND l.status <> 'expired'
        AND l.expiration_date >= $1::date
        AND l.expiration_date <= $1::date + ($2::int * INTERVAL '1 day')
      ORDER BY l.expiration_date ASC, p.name ASC, l.entry_date ASC
      `,
      [referenceDate, windowDays]
    );

    return result.rows.map(mapAlertRow);
  }

  async findExpiredLots(referenceDate: Date): Promise<ProductLotAlert[]> {
    const result: QueryResult<AlertLotRow> = await this.query(
      `
      WITH stock_summary AS (
        SELECT
          product_id,
          COALESCE(SUM(
            CASE
              WHEN remaining_quantity > 0
                AND (expiration_date IS NULL OR expiration_date >= $1::date)
                AND status <> 'blocked'
              THEN remaining_quantity
              ELSE 0
            END
          ), 0) AS available_quantity
        FROM stock_lots
        GROUP BY product_id
      )
      SELECT
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        p.status,
        p.minimum_stock,
        COALESCE(ss.available_quantity, 0) AS available_quantity,
        l.id AS lot_id,
        l.code AS lot_code,
        l.received_quantity AS lot_received_quantity,
        l.remaining_quantity AS lot_remaining_quantity,
        l.entry_date AS lot_entry_date,
        l.expiration_date AS lot_expiration_date,
        l.status AS lot_status
      FROM stock_lots l
      INNER JOIN products p ON p.id = l.product_id
      LEFT JOIN stock_summary ss ON ss.product_id = p.id
      WHERE
        p.status = 'active'
        AND l.expiration_date IS NOT NULL
        AND l.remaining_quantity > 0
        AND (l.expiration_date < $1::date OR l.status = 'expired')
      ORDER BY l.expiration_date ASC, p.name ASC, l.entry_date ASC
      `,
      [referenceDate]
    );

    return result.rows.map(mapAlertRow);
  }
}
