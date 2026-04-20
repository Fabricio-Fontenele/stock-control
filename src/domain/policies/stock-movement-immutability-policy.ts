export class StockMovementImmutabilityError extends Error {
  constructor() {
    super("Stock movement deletion is not allowed");
    this.name = "StockMovementImmutabilityError";
  }
}

export const enforceStockMovementImmutability = (): never => {
  throw new StockMovementImmutabilityError();
};
