import { prisma } from "../lib/prisma";
import { TRADE_FAMILY, normaliseRole } from "../middlewares/role";

// ── Settings ───────────────────────────────────────────────────────────────
// All pricing rules live in the Setting table so the admin team can edit them
// without a code change. These defaults are used only when a key is missing.
export const SETTING_DEFAULTS = {
  gstEnabled: false, // continence aids / NDIS supplies may be GST-free
  gstRate: 0.1,
  ndisAnnualDiscountPct: 0,
  consumerSubscriptionDiscountPct: 0,
  deliveryMode: "FLAT" as "FLAT" | "POSTCODE",
  deliveryFlatFee: 0,
  freeDeliveryThreshold: 0,
};

export type Settings = typeof SETTING_DEFAULTS;

// Load all settings, merged over the defaults.
export const getSettings = async (): Promise<Settings> => {
  const rows = await prisma.setting.findMany();
  const map: Record<string, any> = {};
  for (const row of rows) map[row.key] = row.value;
  return { ...SETTING_DEFAULTS, ...map };
};

// Upsert a single setting (admin).
export const setSetting = async (key: string, value: any) => {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
};

// Looks up the actual role for a signed-in user, or null for a guest.
// Pricing must never guess a role for an anonymous visitor — that's the
// difference between "not signed in" (always main price) and "signed in
// as Consumer" (may have its own Consumer price override).
export const getViewerRole = async (userId?: string | null): Promise<string | null> => {
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user ? normaliseRole(user.role) : null;
};

// ── Unit price resolution ────────────────────────────────────────────────────
// Resolve the unit price for a product, given the buyer's role and quantity.
// `role` is null/undefined for an anonymous visitor — that always skips
// straight to step 3 (main retail price), never a role-specific override.
//   0. NegotiatedPrice for (user, product) — per-account custom rate (Phase 3)
//   1. PriceOverride for (product, role)   — explicit per-product price
//   2. TRADE_FAMILY: highest matching volume tier (minQuantity <= quantity)
//   3. Fallback: product retail price (minus its own discount)
export const resolveUnitPrice = async (params: {
  productId: string;
  role?: string | null;
  quantity?: number;
  userId?: string | null;
}): Promise<number> => {
  const { productId } = params;
  const role = params.role ? normaliseRole(params.role) : null;
  const quantity = params.quantity ?? 1;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { title: true, price: true, discount: true },
  });
  if (!product) throw new Error("Product not found");

  // A corrupted/blank price (NaN, null, 0 or negative) must never silently
  // flow into a quote/order total as NaN — fail loudly and name the product
  // so the coordinator/admin knows exactly what to fix.
  const assertFinitePrice = (value: unknown, source: string): number => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(
        `"${product.title}" has an invalid ${source} price — please fix its price before quoting/ordering it.`
      );
    }
    return n;
  };

  // 0. Per-account negotiated price wins over everything.
  if (params.userId) {
    const negotiated = await prisma.negotiatedPrice.findUnique({
      where: { userId_productId: { userId: params.userId, productId } },
    });
    if (negotiated) return assertFinitePrice(negotiated.price, "negotiated");
  }

  // 1. Explicit override for this role — only when signed in.
  if (role) {
    const override = await prisma.priceOverride.findUnique({
      where: { productId_role: { productId, role } },
    });
    if (override) return assertFinitePrice(override.price, "role override");
  }

  // 2. Wholesale volume tiers — highest minQuantity that the quantity
  // satisfies, looked up under the buyer's own role (TRADE/RETAILER/
  // DISTRIBUTOR each have their own tiers, e.g. deeper Distributor discounts).
  if (role && TRADE_FAMILY.includes(role)) {
    const tier = await prisma.pricingTier.findFirst({
      where: {
        role,
        minQuantity: { lte: quantity },
        OR: [{ productId }, { productId: null }],
      },
      orderBy: [{ productId: "desc" }, { minQuantity: "desc" }],
    });
    if (tier) return assertFinitePrice(tier.pricePerUnit, "wholesale tier");
  }

  // 3. Retail price with the product's own discount applied.
  const discount = typeof product.discount === "number" && Number.isFinite(product.discount) ? product.discount : 0;
  const retail = assertFinitePrice(product.price, "retail");
  return discount > 0 ? +(retail - (retail * discount) / 100).toFixed(2) : retail;
};

// Batch-resolve a "starting from" display price (quantity 1) for a list of
// products at once — used by product listing/search/detail endpoints, where
// resolveUnitPrice's one-round-trip-per-product approach would mean dozens
// of extra queries per page load. Mirrors resolveUnitPrice's priority order
// (negotiated > role override > wholesale tier > retail-minus-discount) but
// looks each table up once for the whole batch instead of once per product.
// The real per-quantity price is still resolved via resolveUnitPrice at
// actual cart/checkout time, where the buyer's chosen quantity matters.
export const attachDisplayPrices = async <T extends { id: string; price: number; discount?: number | null }>(
  products: T[],
  role: string | null,
  userId?: string | null
): Promise<(T & { displayPrice: number })[]> => {
  const ids = products.map((p) => p.id);
  if (ids.length === 0) return [];

  const negotiated = userId
    ? await prisma.negotiatedPrice.findMany({ where: { userId, productId: { in: ids } } })
    : [];
  const negotiatedByProduct = new Map(negotiated.map((n) => [n.productId, n.price]));

  const overrides = role
    ? await prisma.priceOverride.findMany({ where: { role, productId: { in: ids } } })
    : [];
  const overrideByProduct = new Map(overrides.map((o) => [o.productId, o.price]));

  const tiers =
    role && TRADE_FAMILY.includes(role)
      ? await prisma.pricingTier.findMany({
          where: { role, minQuantity: { lte: 1 }, OR: [{ productId: { in: ids } }, { productId: null }] },
          orderBy: { minQuantity: "desc" },
        })
      : [];
  // First tier seen per key wins (already sorted by minQuantity desc), and a
  // product-specific tier is checked before the global fallback below.
  const tierByProduct = new Map<string, number>();
  for (const t of tiers) {
    const key = t.productId ?? "__global__";
    if (!tierByProduct.has(key)) tierByProduct.set(key, t.pricePerUnit);
  }

  const validPrice = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;

  return products.map((p) => {
    const negotiatedPrice = negotiatedByProduct.get(p.id);
    if (validPrice(negotiatedPrice)) return { ...p, displayPrice: negotiatedPrice };

    const overridePrice = overrideByProduct.get(p.id);
    if (validPrice(overridePrice)) return { ...p, displayPrice: overridePrice };

    const tierPrice = tierByProduct.get(p.id) ?? tierByProduct.get("__global__");
    if (validPrice(tierPrice)) return { ...p, displayPrice: tierPrice };

    const discount = typeof p.discount === "number" && Number.isFinite(p.discount) ? p.discount : 0;
    const retail = Number.isFinite(p.price) ? p.price : 0;
    const displayPrice = discount > 0 ? +(retail - (retail * discount) / 100).toFixed(2) : retail;
    return { ...p, displayPrice };
  });
};

// ── Delivery & GST helpers ────────────────────────────────────────────────────
export const calcDelivery = (settings: Settings, orderSubtotal: number): number => {
  if (settings.freeDeliveryThreshold > 0 && orderSubtotal >= settings.freeDeliveryThreshold) {
    return 0;
  }
  // POSTCODE mode is a future extension (NSW-only Year 1); for now both modes
  // use the flat fee until postcode rules are added.
  return settings.deliveryFlatFee ?? 0;
};

export const calcGst = (settings: Settings, taxableAmount: number): number => {
  if (!settings.gstEnabled) return 0;
  return +(taxableAmount * settings.gstRate).toFixed(2);
};

// ── Subscribe & Save tiers ──────────────────────────────────────────────────
// "Subscribe & Save" auto-refill discount, keyed by interval in days. Longer
// commitments earn a bigger discount — mirrors the standard e-commerce
// 2 / 4 / 6 / 12-month refill pattern.
export const SUBSCRIPTION_INTERVAL_TIERS = [
  { months: 2, days: 60, discountPct: 10 },
  { months: 4, days: 120, discountPct: 15 },
  { months: 6, days: 180, discountPct: 18 },
  { months: 12, days: 365, discountPct: 20 },
] as const;

// Resolve the discount % for a given interval — exact day match first, else
// the closest tier by day count (so odd custom intervals still get a sane
// discount instead of silently falling back to 0).
export const subscriptionDiscountPctForInterval = (intervalDays?: number | null): number => {
  if (!intervalDays || intervalDays <= 0) return 0;
  const exact = SUBSCRIPTION_INTERVAL_TIERS.find((t) => t.days === intervalDays);
  if (exact) return exact.discountPct;
  const closest = SUBSCRIPTION_INTERVAL_TIERS.reduce((best, t) =>
    Math.abs(t.days - intervalDays) < Math.abs(best.days - intervalDays) ? t : best
  );
  return closest.discountPct;
};

// ── Quote / cart totals ───────────────────────────────────────────────────────
// Shared total builder used by the NDIS quote engine and B2B/consumer carts.
// `annual` applies the NDIS 12-month discount; `subscriptionIntervalDays`
// applies the tiered Subscribe & Save discount for that refill cadence.
export const buildTotals = async (params: {
  net: number; // subtotal AFTER any line-level pricing, BEFORE order-level discounts
  settings?: Settings;
  annual?: boolean;
  subscription?: boolean;
  subscriptionIntervalDays?: number | null;
}) => {
  const settings = params.settings ?? (await getSettings());
  const subtotal = +params.net.toFixed(2);

  let discount = 0;
  if (params.annual && settings.ndisAnnualDiscountPct > 0) {
    discount = +((subtotal * settings.ndisAnnualDiscountPct) / 100).toFixed(2);
  } else if (params.subscriptionIntervalDays) {
    const pct = subscriptionDiscountPctForInterval(params.subscriptionIntervalDays);
    if (pct > 0) discount = +((subtotal * pct) / 100).toFixed(2);
  } else if (params.subscription && settings.consumerSubscriptionDiscountPct > 0) {
    // Legacy fallback for callers that only know "this is a subscription"
    // without an interval (kept for backward compatibility).
    discount = +((subtotal * settings.consumerSubscriptionDiscountPct) / 100).toFixed(2);
  }

  const netAfterDiscount = +(subtotal - discount).toFixed(2);
  const delivery = calcDelivery(settings, netAfterDiscount);
  const gst = calcGst(settings, netAfterDiscount + delivery);
  const total = +(netAfterDiscount + delivery + gst).toFixed(2);

  return { subtotal, discount, delivery, gst, total, settings };
};
