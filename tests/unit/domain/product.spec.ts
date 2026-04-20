import { describe, expect, it } from "vitest";

import {
  ensureProductActiveForCommonOperation,
  ensureProductSkuReservation
} from "../../../src/domain/entities/product.js";

describe("product domain rules", () => {
  it("blocks SKU reuse for a different product", () => {
    expect(() =>
      ensureProductSkuReservation(
        {
          id: "product-1"
        },
        "product-2"
      )
    ).toThrow("Product SKU is already reserved");
  });

  it("allows SKU when it belongs to the same product", () => {
    expect(() =>
      ensureProductSkuReservation(
        {
          id: "product-1"
        },
        "product-1"
      )
    ).not.toThrow();
  });

  it("blocks common operations for inactive products", () => {
    expect(() => ensureProductActiveForCommonOperation({ status: "inactive" })).toThrow(
      "Inactive product cannot be used in common operations"
    );
  });
});
