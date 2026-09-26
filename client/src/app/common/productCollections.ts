// Mirrors server/src/constants/productCollections.ts — the curated home-page
// collection strips a product can be placed into from the admin form.
export const PRODUCT_COLLECTION_OPTIONS = [
    { value: "NEW_ARRIVAL", label: "New Arrivals" },
    { value: "BEST_SELLER", label: "Best Seller" },
    { value: "COMBO_PACKAGE", label: "Combo Package" },
] as const;

export type ProductCollectionTag = (typeof PRODUCT_COLLECTION_OPTIONS)[number]["value"];

export const collectionTagLabel = (tag?: string | null): string =>
    PRODUCT_COLLECTION_OPTIONS.find((o) => o.value === tag)?.label ?? "";
