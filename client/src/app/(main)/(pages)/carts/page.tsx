"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchCart, updateCartItem, deleteCartItem } from "@/redux/slices/cartSlice";
import { DisplayPriceInBdt } from "@/utils/DisplayPriceInBdt";
import Link from "next/link";

export default function CartPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { cart, status, error } = useSelector((state: RootState) => state.cartSlice);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCart());
    }
  }, [status, dispatch]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    dispatch(updateCartItem({ itemId, quantity: newQuantity }));
  };

  const handleRemove = (itemId: string) => {
    dispatch(deleteCartItem(itemId));
  };

  if (status === "loading") return <div className="text-center py-20 bg-background text-foreground font-light">Loading your bag…</div>;
  if (error) return <div className="text-red-600 text-center py-20 bg-background">{error}</div>;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-24 bg-background">
        <p className="text-foreground font-light">Your bag is empty.</p>
        <Link href="/products" className="text-secondary font-medium underline mt-2 inline-block">Continue shopping</Link>
      </div>
    );
  }

  const unitPrice = (item: (typeof cart.items)[number]) => (item as any).displayPrice ?? item.product.price;
  const subtotal = cart.items.reduce((sum, item) => sum + (unitPrice(item) * item.quantity), 0);
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="bg-background min-h-screen py-10">
      <div className="container mx-auto px-6">
        <div className="flex items-baseline gap-4">
          <h1 className="font-secondary text-4xl text-title">Your bag</h1>
          <span className="text-[13px] text-accent font-light">{cartCount} item{cartCount === 1 ? "" : "s"}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_330px] gap-10 mt-8 items-start">
          <div className="min-w-0">
            <div className="grid grid-cols-[1fr_110px_90px_24px] gap-3.5 pb-3 border-b border-secondary text-[10.5px] tracking-[.18em] text-accent">
              <span>ITEM</span><span>QUANTITY</span><span className="text-right">TOTAL</span><span />
            </div>
            {cart.items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_110px_90px_24px] gap-3.5 items-center py-5 border-b border-primary-hover">
                <div className="flex gap-4 items-center min-w-0">
                  <div className="w-16 aspect-[4/5] flex-none bg-primary overflow-hidden">
                    {item.product.images?.[0] && (
                      <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-secondary text-[16px] text-title truncate">{item.product.title}</div>
                    <div className="text-[13px] text-foreground font-light mt-1">{DisplayPriceInBdt(unitPrice(item))} each</div>
                  </div>
                </div>
                <div className="flex items-center border border-primary-hover w-fit">
                  <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} className="w-8 h-9 flex items-center justify-center text-foreground">−</button>
                  <span className="w-7 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} className="w-8 h-9 flex items-center justify-center text-foreground">+</button>
                </div>
                <div className="text-right text-[15px]">{DisplayPriceInBdt(unitPrice(item) * item.quantity)}</div>
                <button onClick={() => handleRemove(item.id)} aria-label="Remove" className="text-accent hover:text-secondary text-lg justify-self-end">×</button>
              </div>
            ))}

            <div className="mt-6">
              <Link href="/products" className="text-[11.5px] tracking-[.16em] border-b border-primary-hover text-foreground pb-1">
                ← CONTINUE SHOPPING
              </Link>
            </div>
          </div>

          <aside className="bg-secondary text-secondary-light p-6 lg:sticky lg:top-24">
            <div className="font-secondary text-xl text-background">Summary</div>
            <div className="mt-5 flex flex-col gap-3 text-[14px] font-light">
              <div className="flex justify-between"><span>Subtotal</span><span>{DisplayPriceInBdt(subtotal)}</span></div>
              <div className="flex justify-between"><span>Gift wrap</span><span>Free</span></div>
            </div>
            <div className="flex justify-between items-baseline border-t border-secondary-hover mt-5 pt-4">
              <span className="text-[13px] tracking-[.14em] text-secondary-light/70">TOTAL</span>
              <span className="font-secondary text-2xl text-accent-light">{DisplayPriceInBdt(subtotal)}</span>
            </div>
            <Link
              href="/checkout"
              className="block text-center mt-5 bg-accent-light text-secondary hover:bg-accent h-13 leading-13 text-[11.5px] tracking-[.18em] transition-colors"
            >
              CHECKOUT
            </Link>
            <div className="border-t border-secondary-hover mt-5 pt-4 text-[12px] leading-relaxed text-secondary-light/70 font-light">
              Cash on delivery · bKash · Nagad<br />Dhaka 1–2 days, outside 2–4 days
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
