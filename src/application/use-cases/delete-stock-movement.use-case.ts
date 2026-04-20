import {
  enforceStockMovementImmutability,
  StockMovementImmutabilityError
} from "../../domain/policies/stock-movement-immutability-policy.js";
import { HttpError } from "../errors/http-error.js";

export class DeleteStockMovementUseCase {
  execute(): never {
    try {
      return enforceStockMovementImmutability();
    } catch (error) {
      if (error instanceof StockMovementImmutabilityError) {
        throw new HttpError(405, error.message);
      }

      throw error;
    }
  }
}
