import { type StockLot } from "../entities/stock-lot.js";

export const EXPIRING_WINDOW_DAYS = 15;

const normalizeDate = (value: Date): number => {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
};

const diffDays = (from: Date, to: Date): number => {
  const day = 24 * 60 * 60 * 1000;
  return Math.floor((normalizeDate(to) - normalizeDate(from)) / day);
};

export const requiresExpirationDate = (tracksExpiration: boolean): boolean => {
  return tracksExpiration;
};

export const ensureExpirationDateWhenRequired = (
  tracksExpiration: boolean,
  expirationDate: Date | null
): Date | null => {
  if (tracksExpiration && !expirationDate) {
    throw new Error("Expiration date is required for products that track expiration");
  }

  return expirationDate;
};

export const isLotExpired = (lot: Pick<StockLot, "expirationDate">, now: Date = new Date()): boolean => {
  if (!lot.expirationDate) {
    return false;
  }

  return normalizeDate(lot.expirationDate) < normalizeDate(now);
};

export const isLotExpiringSoon = (
  lot: Pick<StockLot, "expirationDate">,
  now: Date = new Date(),
  windowDays: number = EXPIRING_WINDOW_DAYS
): boolean => {
  if (!lot.expirationDate) {
    return false;
  }

  const days = diffDays(now, lot.expirationDate);
  return days >= 0 && days <= windowDays;
};
