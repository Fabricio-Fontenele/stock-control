import { describe, expect, it } from "vitest";

import { ensureExpiredReleaseAuthorization } from "../../../src/domain/entities/stock-movement.js";

describe("stock movement domain rules", () => {
  it("requires admin role for expired release approval", () => {
    expect(() =>
      ensureExpiredReleaseAuthorization({
        performedByRole: "employee",
        reason: "Quebra de emergencia",
        approvedByUserId: "admin-1"
      })
    ).toThrow("Only admin users can approve expired release");
  });

  it("requires reason and approval user for expired release", () => {
    expect(() =>
      ensureExpiredReleaseAuthorization({
        performedByRole: "admin",
        reason: " ",
        approvedByUserId: null
      })
    ).toThrow("Expired release reason is required");
  });
});
