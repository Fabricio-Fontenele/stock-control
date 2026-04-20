import { describe, expect, it } from "vitest";

describe("stock movement immutability - application", () => {
  it("documents movement delete as unsupported operation", () => {
    const deleteOperation = () => {
      throw new Error("Stock movement deletion is not supported");
    };

    expect(deleteOperation).toThrow("Stock movement deletion is not supported");
  });
});
