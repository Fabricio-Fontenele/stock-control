import { HttpError } from "../../application/errors/http-error.js";

export const enforceStockMovementImmutability = (): never => {
  throw new HttpError(405, "Stock movement deletion is not allowed");
};
