import { prisma } from "../lib/prisma";
import { ROLES } from "../middlewares/role";
import { resolveUnitPrice, buildTotals, subscriptionDiscountPctForInterval } from "./pricing";

// Days for each supply period. One-off uses the product's pack quantity
// (passed per-line), Monthly = 30, Annual = 365 — plus the tiered
// Subscribe & Save periods (2/4/6/12-month recurring supply).
export const SUPPLY_PERIOD_DAYS: Record<string, number | "PACK"> = {
  "One-off": "PACK",
  Monthly: 30,
  "Every 2 Months": 60,
  "Every 4 Months": 120,
  "Every 6 Months": 180,
  Annual: 365,
};

// Recurring supply periods earn the same tiered discount as the consumer
// Subscribe & Save plans (60d→10%, 120d→15%, 180d→18%, 365d→20%).
const RECURRING_PERIODS = new Set(["Every 2 Months", "Every 4 Months", "Every 6 Months"]);

export interface QuoteLineInput {
  productId: string;
  size?: string;
  absorbency?: string;
  dailyPads: number;
  // For One-off, the pack quantity (days defaults to packQuantity).
  packQuantity?: number;
}

// Compute a full NDIS quote (line items + totals) without persisting.
// Mirrors the Excel calculator: total pads = daily pads × days; subtotal =
// total pads × unit price; annual discount + delivery + configurable GST.
export const computeQuote = async (params: {
  supplyPeriod: string;
  lines: QuoteLineInput[];
}) => {
  const { supplyPeriod, lines } = params;
  const periodDays = SUPPLY_PERIOD_DAYS[supplyPeriod] ?? 30;

  const items = [];
  let net = 0;

  for (const line of lines) {
    const product = await prisma.product.findUnique({
      where: { id: line.productId },
      select: { id: true, title: true },
    });
    if (!product) throw new Error(`Product not found: ${line.productId}`);

    // Days in this line's supply period.
    const days =
      periodDays === "PACK" ? line.packQuantity ?? 1 : (periodDays as number);

    const totalPads = Math.max(0, Math.round(line.dailyPads * days));

    // NDIS coordinators are quoted at the NDIS price (override) or retail.
    const unitPrice = await resolveUnitPrice({
      productId: line.productId,
      role: ROLES.NDIS_COORDINATOR,
      quantity: totalPads,
    });

    const lineTotal = +(totalPads * unitPrice).toFixed(2);
    net += lineTotal;

    items.push({
      productId: product.id,
      productName: product.title,
      size: line.size ?? null,
      absorbency: line.absorbency ?? null,
      dailyPads: line.dailyPads,
      days,
      totalPads,
      unitPrice,
      lineTotal,
    });
  }

  // Annual supply uses the configurable NDIS annual discount (falling back
  // to the tiered 12-month discount when that setting is 0); the recurring
  // 2/4/6-month periods use the tiered Subscribe & Save discount.
  const totals = await buildTotals({
    net,
    annual: supplyPeriod === "Annual",
    subscriptionIntervalDays:
      RECURRING_PERIODS.has(supplyPeriod) || supplyPeriod === "Annual"
        ? (SUPPLY_PERIOD_DAYS[supplyPeriod] as number)
        : undefined,
  });

  return { items, ...totals };
};
