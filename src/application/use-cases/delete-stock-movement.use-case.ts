import { enforceStockMovementImmutability } from "../../domain/policies/stock-movement-immutability-policy.js";

export class DeleteStockMovementUseCase {
  execute(): never {
    return enforceStockMovementImmutability();
  }
}
