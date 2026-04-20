import { describe, expect, it } from "vitest";

import { selectLotsByFefo } from "../../../src/domain/policies/stock-balance-policy.js";
import { STOCK_LOT_STATUS, type StockLot } from "../../../src/domain/entities/stock-lot.js";

const createLot = (params: Partial<StockLot>): StockLot => ({
  id: params.id ?? crypto.randomUUID(),
  productId: params.productId ?? "product-1",
  code: params.code ?? "LOT-1",
  receivedQuantity: params.receivedQuantity ?? 10,
  remainingQuantity: params.remainingQuantity ?? 10,
  entryDate: params.entryDate ?? new Date("2026-01-01"),
  expirationDate: params.expirationDate ?? new Date("2026-12-31"),
  status: params.status ?? STOCK_LOT_STATUS.AVAILABLE,
  createdAt: params.createdAt ?? new Date("2026-01-01T00:00:00Z"),
  updatedAt: params.updatedAt ?? new Date("2026-01-01T00:00:00Z")
});

describe("stock-balance-policy", () => {
  it("selects nearest expiration lot first using FEFO", () => {
    const lots = [
      createLot({ id: "late", expirationDate: new Date("2026-10-10") }),
      createLot({ id: "soon", expirationDate: new Date("2026-03-10") })
    ];

    const plan = selectLotsByFefo(lots, 5, new Date("2026-01-15"));

    expect(plan).toEqual([{ lotId: "soon", quantity: 5 }]);
  });

  it("uses entry date as tiebreaker when expiration is the same", () => {
    const lots = [
      createLot({
        id: "newer",
        expirationDate: new Date("2026-08-01"),
        entryDate: new Date("2026-02-01")
      }),
      createLot({
        id: "older",
        expirationDate: new Date("2026-08-01"),
        entryDate: new Date("2026-01-01")
      })
    ];

    const plan = selectLotsByFefo(lots, 1, new Date("2026-01-15"));

    expect(plan[0]).toEqual({ lotId: "older", quantity: 1 });
  });

  it("blocks expired lots from common exits", () => {
    const lots = [
      createLot({
        id: "expired",
        expirationDate: new Date("2026-01-01"),
        remainingQuantity: 10
      })
    ];

    expect(() => selectLotsByFefo(lots, 1, new Date("2026-01-15"))).toThrow(
      "Insufficient available balance for requested exit"
    );
  });

  it("prevents negative stock by rejecting insufficient balance", () => {
    const lots = [createLot({ id: "only", remainingQuantity: 2 })];

    expect(() => selectLotsByFefo(lots, 3, new Date("2026-01-15"))).toThrow(
      "Insufficient available balance for requested exit"
    );
  });

  it("does not select blocked lots for common exits", () => {
    const lots = [
      createLot({
        id: "blocked",
        status: STOCK_LOT_STATUS.BLOCKED,
        remainingQuantity: 5,
        expirationDate: new Date("2026-12-01")
      }),
      createLot({
        id: "available",
        status: STOCK_LOT_STATUS.AVAILABLE,
        remainingQuantity: 5,
        expirationDate: new Date("2026-12-10")
      })
    ];

    const plan = selectLotsByFefo(lots, 2, new Date("2026-01-15"));
    expect(plan).toEqual([{ lotId: "available", quantity: 2 }]);
  });
});
