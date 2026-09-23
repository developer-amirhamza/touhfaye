

export const DisplayPriceInBdt = (price: number) => {
    return new Intl.NumberFormat("en-BD", {
        style: "currency",
        currency: "BDT",
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: 0,
    }).format(price)
}