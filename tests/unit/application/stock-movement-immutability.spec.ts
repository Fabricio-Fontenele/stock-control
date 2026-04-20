import { describe, expect, it } from "vitest";
import { DeleteStockMovementUseCase } from "../../../src/application/use-cases/delete-stock-movement.use-case.js";
import { HttpError } from "../../../src/application/errors/http-error.js";

describe("stock movement immutability - application", () => {
  it("maps immutable deletion policy to HTTP 405", () => {
    const useCase = new DeleteStockMovementUseCase();

    expect(() => useCase.execute()).toThrow(HttpError);

    try {
      useCase.execute();
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).statusCode).toBe(405);
      expect((error as HttpError).message).toBe("Stock movement deletion is not allowed");
    }
  });
});
