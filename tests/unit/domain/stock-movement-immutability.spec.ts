import { describe, expect, it } from "vitest";

import { enforceStockMovementImmutability } from "../../../src/domain/policies/stock-movement-immutability-policy.js";

describe("stock movement immutability - domain", () => {
  it("always blocks movement deletion", () => {
    expect(() => enforceStockMovementImmutability()).toThrow(
      "Stock movement deletion is not allowed"
    );
  });
});
