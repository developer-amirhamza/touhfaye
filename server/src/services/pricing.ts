// Product pricing: either a single retail price (with an optional %
// discount), or a set of independently-priced variants — different sizes,
// weights, or pack/combo/bundle options, each with its own price, shown as
// the product page's SIZE picker. There is no buyer-role or wholesale-tier
// pricing anymore: every viewer sees the same price for the same selection.

export interface ProductVariant {
  label: string;
  price: number;
  stock?: number;
}

// Parses/validates a product's stored `variants` JSON into a clean array,
// dropping anything malformed rather than letting a bad admin edit corrupt
// pricing everywhere it's rendered.
export const parseVariants = (raw: unknown): ProductVariant[] => {
  if (!Array.isArray(raw)) return [];
  const parsed: ProductVariant[] = raw.map((v: any) => ({
    label: typeof v?.label === "string" ? v.label.trim() : "",
    price: Number(v?.price),
    stock:
      v?.stock !== undefined && v?.stock !== null && Number.isFinite(Number(v.stock))
        ? Number(v.stock)
        : undefined,
  }));
  return parsed.filter((v) => Boolean(v.label) && Number.isFinite(v.price) && v.price > 0);
};

// Resolve the unit price for one line: the named variant's own price if the
// product has one matching that label, otherwise the product's own
// discount-adjusted retail price. An empty/missing `variantLabel` always
// means "the product's base price" — a product with variants configured
// never silently charges the first variant's price for an unselected line.
export const resolveProductPrice = (
  product: { price: number; discount?: number | null; variants?: unknown },
  variantLabel?: string | null
): number => {
  const label = variantLabel?.trim();
  if (label) {
    const variant = parseVariants(product.variants).find((v) => v.label === label);
    if (variant) return variant.price;
  }
  const discount = typeof product.discount === "number" && Number.isFinite(product.discount) ? product.discount : 0;
  const retail = Number.isFinite(product.price) ? product.price : 0;
  return discount > 0 ? +(retail - (retail * discount) / 100).toFixed(2) : retail;
};

// Batch "starting from" display price for a list of products (listing/search/
// card views) — the cheapest variant if the product has any, else its own
// discount-adjusted retail price. Purely synchronous now that pricing no
// longer depends on the viewer's role or a database round trip per product.
export const attachDisplayPrices = <T extends { price: number; discount?: number | null; variants?: unknown }>(
  products: T[]
): (T & { displayPrice: number })[] => {
  return products.map((p) => {
    const variants = parseVariants(p.variants);
    const displayPrice =
      variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : resolveProductPrice(p);
    return { ...p, displayPrice };
  });
};
