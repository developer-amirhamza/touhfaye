"use strict";
// Product pricing: either a single retail price (with an optional %
// discount), or a set of independently-priced variants — different sizes,
// weights, or pack/combo/bundle options, each with its own price, shown as
// the product page's SIZE picker. There is no buyer-role or wholesale-tier
// pricing anymore: every viewer sees the same price for the same selection.
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachDisplayPrices = exports.resolveProductPrice = exports.parseVariants = void 0;
// Parses/validates a product's stored `variants` JSON into a clean array,
// dropping anything malformed rather than letting a bad admin edit corrupt
// pricing everywhere it's rendered.
const parseVariants = (raw) => {
    if (!Array.isArray(raw))
        return [];
    const parsed = raw.map((v) => ({
        label: typeof v?.label === "string" ? v.label.trim() : "",
        price: Number(v?.price),
        stock: v?.stock !== undefined && v?.stock !== null && Number.isFinite(Number(v.stock))
            ? Number(v.stock)
            : undefined,
    }));
    return parsed.filter((v) => Boolean(v.label) && Number.isFinite(v.price) && v.price > 0);
};
exports.parseVariants = parseVariants;
// Resolve the unit price for one line: the named variant's own price if the
// product has one matching that label, otherwise the product's own
// discount-adjusted retail price. An empty/missing `variantLabel` always
// means "the product's base price" — a product with variants configured
// never silently charges the first variant's price for an unselected line.
const resolveProductPrice = (product, variantLabel) => {
    const label = variantLabel?.trim();
    if (label) {
        const variant = (0, exports.parseVariants)(product.variants).find((v) => v.label === label);
        if (variant)
            return variant.price;
    }
    const discount = typeof product.discount === "number" && Number.isFinite(product.discount) ? product.discount : 0;
    const retail = Number.isFinite(product.price) ? product.price : 0;
    return discount > 0 ? +(retail - (retail * discount) / 100).toFixed(2) : retail;
};
exports.resolveProductPrice = resolveProductPrice;
// Batch "starting from" display price for a list of products (listing/search/
// card views) — the cheapest variant if the product has any, else its own
// discount-adjusted retail price. Purely synchronous now that pricing no
// longer depends on the viewer's role or a database round trip per product.
const attachDisplayPrices = (products) => {
    return products.map((p) => {
        const variants = (0, exports.parseVariants)(p.variants);
        const displayPrice = variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : (0, exports.resolveProductPrice)(p);
        return { ...p, displayPrice };
    });
};
exports.attachDisplayPrices = attachDisplayPrices;
