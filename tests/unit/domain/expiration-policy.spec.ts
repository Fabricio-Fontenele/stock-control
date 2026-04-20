import { describe, expect, it } from "vitest";

import {
  EXPIRING_WINDOW_DAYS,
  ensureExpirationDateWhenRequired,
  isLotExpired,
  isLotExpiringSoon
} from "../../../src/domain/policies/expiration-policy.js";

describe("expiration-policy", () => {
  it("requires expiration date when product tracks expiration", () => {
    expect(() => ensureExpirationDateWhenRequired(true, null)).toThrow(
      "Expiration date is required for products that track expiration"
    );
  });

  it("classifies lot as expiring soon when within 15 days", () => {
    const now = new Date("2026-01-10");
    const lot = { expirationDate: new Date("2026-01-20") };

    expect(isLotExpiringSoon(lot, now, EXPIRING_WINDOW_DAYS)).toBe(true);
  });

  it("classifies lot as expired when expiration date is in the past", () => {
    const now = new Date("2026-01-10");
    const lot = { expirationDate: new Date("2026-01-01") };

    expect(isLotExpired(lot, now)).toBe(true);
  });
});
