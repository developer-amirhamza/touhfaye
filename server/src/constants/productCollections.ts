// The curated home-page collection strips a product can be placed into from
// the admin product form (Product.collectionTag). A product belongs to at
// most one at a time — unrelated to isFeatured/discount, which drive other
// badges elsewhere in the storefront.
export const PRODUCT_COLLECTION_TAGS = ["NEW_ARRIVAL", "BEST_SELLER", "COMBO_PACKAGE"] as const;

export type ProductCollectionTag = (typeof PRODUCT_COLLECTION_TAGS)[number];
