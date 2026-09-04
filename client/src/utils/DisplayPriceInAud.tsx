

export const DisplayPriceInAud = (price:number)=>{
    return new Intl.NumberFormat("en-IN",{
        style:"currency",
        currency:"aud"
    }).format(price)
}