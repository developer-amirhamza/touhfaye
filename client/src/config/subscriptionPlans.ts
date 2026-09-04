// "Subscribe & Save" auto-refill tiers — mirrors the backend's
// SUBSCRIPTION_INTERVAL_TIERS in server/src/services/pricing.ts. Keep the two
// in sync if the discount schedule ever changes.
export interface SubscriptionPlan {
  months: number;
  days: number;
  discountPct: number;
  label: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { months: 2, days: 60, discountPct: 10, label: "Every 2 Months (10% off)" },
  { months: 4, days: 120, discountPct: 15, label: "Every 4 Months (15% off)" },
  { months: 6, days: 180, discountPct: 18, label: "Every 6 Months (18% off)" },
  { months: 12, days: 365, discountPct: 20, label: "Every 12 Months (20% off)" },
];

export const planForDays = (days?: number | null): SubscriptionPlan | undefined =>
  SUBSCRIPTION_PLANS.find((p) => p.days === days);
