import { describe, expect, it, vi } from "vitest";

import { ListMovementsReportUseCase } from "../../../src/application/use-cases/list-movements-report.use-case.js";

describe("ListMovementsReportUseCase", () => {
  it("delegates filter to movement repository", async () => {
    const movementRepository = {
      listReport: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      createRejectedAttempt: vi.fn(),
      list: vi.fn()
    };

    const useCase = new ListMovementsReportUseCase({
      movementRepository
    });

    await useCase.execute({
      productId: "product-1"
    });

    expect(movementRepository.listReport).toHaveBeenCalledWith({
      productId: "product-1"
    });
  });
});
