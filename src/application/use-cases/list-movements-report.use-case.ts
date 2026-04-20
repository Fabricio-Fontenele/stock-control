import type {
  MovementFilter,
  MovementRepository,
  MovementViewRow
} from "../ports/movement-repository.js";

interface ListMovementsReportDependencies {
  movementRepository: MovementRepository;
}

export class ListMovementsReportUseCase {
  constructor(private readonly deps: ListMovementsReportDependencies) {}

  async execute(filter?: MovementFilter): Promise<MovementViewRow[]> {
    return this.deps.movementRepository.listReport(filter);
  }
}
