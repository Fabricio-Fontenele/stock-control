import { EXPIRING_WINDOW_DAYS } from "../../domain/policies/expiration-policy.js";
import type { DashboardAlertsDto } from "../dto/stock-entry-dto.js";
import type { StockRepository } from "../ports/stock-repository.js";

interface GetDashboardAlertsDependencies {
  stockRepository: StockRepository;
}

type AggregatedLotGroup = {
  id: string;
  sku: string;
  name: string;
  status: "active" | "inactive";
  availableQuantity: number;
  minimumStock: number;
  belowMinimum: boolean;
  expiringWithinDays: 15;
  hasExpiredLots: boolean;
  lots: Array<{
    id: string;
    code: string;
    receivedQuantity: number;
    remainingQuantity: number;
    entryDate: Date;
    expirationDate: Date;
    status: "available" | "depleted" | "expired" | "blocked";
  }>;
};

export class GetDashboardAlertsUseCase {
  constructor(private readonly deps: GetDashboardAlertsDependencies) {}

  async execute(referenceDate: Date = new Date()): Promise<DashboardAlertsDto> {
    const [belowMinimumProducts, expiringLots, expiredLots] = await Promise.all([
      this.deps.stockRepository.findBelowMinimumProducts(referenceDate),
      this.deps.stockRepository.findExpiringLots(referenceDate, EXPIRING_WINDOW_DAYS),
      this.deps.stockRepository.findExpiredLots(referenceDate)
    ]);

    const expiringGrouped = this.groupLotsByProduct(expiringLots, false);
    const expiredGrouped = this.groupLotsByProduct(expiredLots, true);

    const belowMinimum = this.mergeBelowMinimum(
      belowMinimumProducts,
      expiringGrouped,
      expiredGrouped
    );

    return {
      belowMinimum,
      expiringSoon: expiringGrouped,
      expired: expiredGrouped
    };
  }

  private groupLotsByProduct(
    rows: Awaited<ReturnType<StockRepository["findExpiringLots"]>>,
    hasExpiredLots: boolean
  ): AggregatedLotGroup[] {
    const map = new Map<string, AggregatedLotGroup>();

    for (const row of rows) {
      const current = map.get(row.productId);

      if (!current) {
        map.set(row.productId, {
          id: row.productId,
          sku: row.sku,
          name: row.productName,
          status: row.status,
          availableQuantity: row.availableQuantity,
          minimumStock: row.minimumStock,
          belowMinimum: row.isBelowMinimum,
          expiringWithinDays: 15,
          hasExpiredLots,
          lots: [
            {
              id: row.lotId,
              code: row.lotCode,
              receivedQuantity: row.lotReceivedQuantity,
              remainingQuantity: row.lotRemainingQuantity,
              entryDate: row.lotEntryDate,
              expirationDate: row.lotExpirationDate,
              status: row.lotStatus
            }
          ]
        });

        continue;
      }

      current.lots.push({
        id: row.lotId,
        code: row.lotCode,
        receivedQuantity: row.lotReceivedQuantity,
        remainingQuantity: row.lotRemainingQuantity,
        entryDate: row.lotEntryDate,
        expirationDate: row.lotExpirationDate,
        status: row.lotStatus
      });

      if (hasExpiredLots) {
        current.hasExpiredLots = true;
      }
    }

    return [...map.values()];
  }

  private mergeBelowMinimum(
    belowMinimumProducts: Awaited<ReturnType<StockRepository["findBelowMinimumProducts"]>>,
    expiringSoon: AggregatedLotGroup[],
    expired: AggregatedLotGroup[]
  ): DashboardAlertsDto["belowMinimum"] {
    const merged = new Map<string, DashboardAlertsDto["belowMinimum"][number]>();

    for (const product of belowMinimumProducts) {
      merged.set(product.productId, {
        id: product.productId,
        sku: product.sku,
        name: product.productName,
        status: product.status,
        availableQuantity: product.availableQuantity,
        minimumStock: product.minimumStock,
        belowMinimum: true,
        expiringWithinDays: 15,
        hasExpiredLots: product.hasExpiredLots
      });
    }

    for (const group of [...expiringSoon, ...expired]) {
      if (!group.belowMinimum) {
        continue;
      }

      if (!merged.has(group.id)) {
        merged.set(group.id, {
          id: group.id,
          sku: group.sku,
          name: group.name,
          status: group.status,
          availableQuantity: group.availableQuantity,
          minimumStock: group.minimumStock,
          belowMinimum: true,
          expiringWithinDays: 15,
          hasExpiredLots: group.hasExpiredLots
        });
      }
    }

    return [...merged.values()];
  }
}
