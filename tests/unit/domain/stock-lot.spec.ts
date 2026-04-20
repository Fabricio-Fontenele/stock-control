import { describe, expect, it } from "vitest";

import {
  ensureLotRemainingQuantity,
  ensurePositiveLotQuantity
} from "../../../src/domain/entities/stock-lot.js";

describe("stock-lot", () => {
  it("rejects non-positive received quantity", () => {
    expect(() => ensurePositiveLotQuantity(0)).toThrow("Lot quantity must be greater than zero");
  });

  it("rejects remaining quantity out of valid range", () => {
    expect(() => ensureLotRemainingQuantity(-1, 10)).toThrow(
      "Lot remaining quantity must be between zero and received quantity"
    );
    expect(() => ensureLotRemainingQuantity(11, 10)).toThrow(
      "Lot remaining quantity must be between zero and received quantity"
    );
  });
});
