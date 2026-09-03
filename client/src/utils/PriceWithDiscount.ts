
export const PriceWithDiscount = (
    price: number | string | undefined,
    discount: number | string | undefined
) => {
    const productPrice = Number(price ?? 0);
    const productDiscount = Number(discount ?? 0);

    if (productDiscount > 0) {
        const discountAmount = Math.ceil((productPrice * productDiscount) / 100);
        return productPrice - discountAmount;
    }

    return productPrice;
}

// The price to actually show for a product: the server already resolves
// `displayPrice` per viewer (their portal role's price if signed in and one
// is set, otherwise the main price — always the main price for a guest).
// Falls back to the plain retail-minus-discount math only for a response
// that predates this field, so nothing breaks on a stale cached response.
export const getDisplayPrice = (product: {
    displayPrice?: number | string | null;
    price?: number | string;
    discount?: number | string;
} | undefined | null): number => {
    if (!product) return 0;
    if (product.displayPrice !== undefined && product.displayPrice !== null) {
        const n = Number(product.displayPrice);
        if (Number.isFinite(n)) return n;
    }
    return PriceWithDiscount(product.price, product.discount);
};
