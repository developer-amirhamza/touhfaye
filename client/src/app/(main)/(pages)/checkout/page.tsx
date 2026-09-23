"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/redux/store";
import { createCheckoutSession, clearStripeUrl, placeOrder } from "@/redux/slices/orderSlice";
import { fetchCart } from "@/redux/slices/cartSlice";
import { DisplayPriceInBdt } from "@/utils/DisplayPriceInBdt";
import { planForDays } from "@/config/subscriptionPlans";
import toast from "react-hot-toast";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
  pincode: string;
}

type PayMethod = "COD" | "BKASH" | "NAGAD" | "CARD";
type DeliveryArea = "DHAKA" | "OUTSIDE";

const FREE_DELIVERY_THRESHOLD = 1500;
const DELIVERY_COST_DHAKA = 60;
const DELIVERY_COST_OUTSIDE = 120;

const PAY_METHODS: { value: PayMethod; label: string; note: string }[] = [
  { value: "COD", label: "Cash on delivery", note: "Pay the courier when your parcel arrives." },
  { value: "BKASH", label: "bKash", note: "Send payment, then enter the transaction ID." },
  { value: "NAGAD", label: "Nagad", note: "Send payment, then enter the transaction ID." },
  { value: "CARD", label: "Pay by card", note: "Secure card payment via Stripe." },
];

const CheckoutPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { cart, status: cartStatus } = useSelector((state: RootState) => state.cartSlice);
  const { stripeUrl, status: orderStatus, error } = useSelector((state: RootState) => state.orderSlice);
  const user = useSelector((state: RootState) => state.userSlice.user);

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine: "",
    city: "",
    district: "",
    pincode: "",
  });

  const [payMethod, setPayMethod] = useState<PayMethod>("COD");
  const [deliveryArea, setDeliveryArea] = useState<DeliveryArea>("DHAKA");
  const [orderNote, setOrderNote] = useState("");
  const [mfsNumber, setMfsNumber] = useState("");
  const [mfsTxnId, setMfsTxnId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: user?.mobile || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (cartStatus === "idle") {
      dispatch(fetchCart());
    }
  }, [cartStatus, dispatch]);

  useEffect(() => {
    if (stripeUrl) {
      window.location.href = stripeUrl;
      dispatch(clearStripeUrl());
    }
  }, [stripeUrl, dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, email, phone, addressLine, city, district, pincode } = form;
    if (!firstName || !email || !phone || !addressLine || !city || !district) {
      toast.error("Please fill in your contact and delivery details");
      return;
    }
    if ((payMethod === "BKASH" || payMethod === "NAGAD") && (!mfsNumber || !mfsTxnId)) {
      toast.error("Please enter the number you paid from and the transaction ID");
      return;
    }
    const shippingAddress = `${addressLine}, ${city}, ${district}${pincode ? `, ${pincode}` : ""}, Bangladesh`;

    setIsSubmitting(true);
    try {
      if (payMethod === "CARD") {
        await dispatch(
          createCheckoutSession({ firstName, lastName: form.lastName, email, phone, shippingAddress, orderNote } as any)
        ).unwrap();
        // The stripeUrl effect handles the redirect.
      } else {
        await dispatch(
          placeOrder({
            firstName,
            lastName: form.lastName,
            email,
            phone,
            shippingAddress,
            orderNote: orderNote || "",
            paymentMethod: payMethod,
            deliveryArea,
            fundingDetails:
              payMethod === "BKASH" || payMethod === "NAGAD"
                ? { method: payMethod, senderNumber: mfsNumber, transactionId: mfsTxnId }
                : undefined,
          })
        ).unwrap();
        toast.success("Your order has been placed!");
        dispatch(fetchCart());
        router.push("/order/success");
      }
    } catch (err: any) {
      toast.error(err?.message || err || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-24 bg-background">
        <p className="text-foreground font-light">Your bag is empty.</p>
        <a href="/products" className="text-secondary font-medium underline mt-2 inline-block">Continue shopping</a>
      </div>
    );
  }

  let subtotal = 0;
  for (const item of cart.items) {
    const price = (item as any).displayPrice ?? item.product.price;
    const subscriptionPlan = planForDays(item.subscriptionIntervalDays);
    const effectivePct = subscriptionPlan ? subscriptionPlan.discountPct : 0;
    const discountedPrice = price - (price * effectivePct) / 100;
    subtotal += discountedPrice * item.quantity;
  }

  const shippingCost = subtotal >= FREE_DELIVERY_THRESHOLD
    ? 0
    : (deliveryArea === "OUTSIDE" ? DELIVERY_COST_OUTSIDE : DELIVERY_COST_DHAKA);
  const grandTotal = subtotal + shippingCost;

  const fieldCls = "border border-primary-hover bg-white px-4 py-3.5 text-sm font-light outline-none focus:border-secondary w-full";
  const busy = isSubmitting || orderStatus === "loading";
  const ctaLabel = busy ? "Processing…" : payMethod === "CARD" ? "PROCEED TO PAYMENT" : `PLACE ORDER — ${DisplayPriceInBdt(grandTotal)}`;

  return (
    <section className="bg-background min-h-screen py-10">
      <div className="container mx-auto px-6">
        <h1 className="font-secondary text-4xl text-title">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_330px] gap-10 mt-8 items-start">
          <div className="min-w-0 flex flex-col gap-9">
            <div>
              <div className="text-[11px] tracking-[.2em] text-title border-b border-secondary pb-2.5">CONTACT</div>
              <div className="grid sm:grid-cols-2 gap-3.5 mt-4">
                <input name="firstName" placeholder="Full name" value={form.firstName} onChange={handleInputChange} required className={`${fieldCls} sm:col-span-2`} />
                <input name="phone" placeholder="Mobile number" value={form.phone} onChange={handleInputChange} required className={fieldCls} />
                <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleInputChange} required className={fieldCls} />
              </div>
            </div>

            <div>
              <div className="text-[11px] tracking-[.2em] text-title border-b border-secondary pb-2.5">DELIVERY ADDRESS</div>
              <div className="grid sm:grid-cols-3 gap-3.5 mt-4">
                <input name="addressLine" placeholder="House, road, area" value={form.addressLine} onChange={handleInputChange} required className={`${fieldCls} sm:col-span-3`} />
                <input name="city" placeholder="City" value={form.city} onChange={handleInputChange} required className={fieldCls} />
                <input name="district" placeholder="District" value={form.district} onChange={handleInputChange} required className={fieldCls} />
                <input name="pincode" placeholder="Postcode (optional)" value={form.pincode} onChange={handleInputChange} className={fieldCls} />
              </div>
            </div>

            <div>
              <div className="text-[11px] tracking-[.2em] text-title border-b border-secondary pb-2.5">DELIVERY METHOD</div>
              <div className="flex flex-col gap-2.5 mt-4">
                {([
                  { value: "DHAKA" as const, label: "Inside Dhaka", eta: "1–2 business days" },
                  { value: "OUTSIDE" as const, label: "Outside Dhaka", eta: "2–4 business days" },
                ]).map((o) => {
                  const active = deliveryArea === o.value;
                  const cost = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : (o.value === "OUTSIDE" ? DELIVERY_COST_OUTSIDE : DELIVERY_COST_DHAKA);
                  return (
                    <button
                      type="button"
                      key={o.value}
                      onClick={() => setDeliveryArea(o.value)}
                      className={`flex items-center gap-3.5 border px-4 py-3.5 text-left transition-colors ${active ? "border-secondary bg-primary" : "border-primary-hover bg-white"}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex-none ${active ? "bg-accent border-accent" : "border-accent"}`} />
                      <span className="flex-1">
                        <span className="block text-sm">{o.label}</span>
                        <span className="block text-xs text-accent font-light mt-0.5">{o.eta}</span>
                      </span>
                      <span className="text-sm">{cost === 0 ? "Free" : DisplayPriceInBdt(cost)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[11px] tracking-[.2em] text-title border-b border-secondary pb-2.5">PAYMENT</div>
              <div className="flex flex-col gap-2.5 mt-4">
                {PAY_METHODS.map((o) => {
                  const active = payMethod === o.value;
                  return (
                    <button
                      type="button"
                      key={o.value}
                      onClick={() => setPayMethod(o.value)}
                      className={`flex items-center gap-3.5 border px-4 py-3.5 text-left transition-colors ${active ? "border-secondary bg-primary" : "border-primary-hover bg-white"}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex-none ${active ? "bg-accent border-accent" : "border-accent"}`} />
                      <span className="flex-1">
                        <span className="block text-sm">{o.label}</span>
                        <span className="block text-xs text-accent font-light mt-0.5">{o.note}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {(payMethod === "BKASH" || payMethod === "NAGAD") && (
                <div className="grid sm:grid-cols-2 gap-3.5 mt-3.5">
                  <input
                    placeholder={`${payMethod === "BKASH" ? "bKash" : "Nagad"} number you paid from`}
                    value={mfsNumber}
                    onChange={(e) => setMfsNumber(e.target.value)}
                    className={fieldCls}
                  />
                  <input
                    placeholder="Transaction ID"
                    value={mfsTxnId}
                    onChange={(e) => setMfsTxnId(e.target.value)}
                    className={fieldCls}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] tracking-[.2em] text-title">ORDER NOTE (OPTIONAL)</label>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="A gift message, delivery instructions, anything we should know"
                rows={3}
                className={`${fieldCls} mt-3`}
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>

          {/* Order summary */}
          <aside className="bg-secondary-light p-6 lg:sticky lg:top-24">
            <div className="font-secondary text-xl text-title">Order</div>
            <div className="flex flex-col gap-3 mt-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="w-12 aspect-[4/5] flex-none bg-primary overflow-hidden">
                    {item.product.images?.[0] && (
                      <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] text-title truncate">{item.product.title}</div>
                    <div className="text-[11.5px] text-accent font-light mt-0.5">Qty {item.quantity}</div>
                  </div>
                  <div className="text-[13.5px] whitespace-nowrap">{DisplayPriceInBdt(((item as any).displayPrice ?? item.product.price) * item.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-primary-hover mt-5 pt-4 flex flex-col gap-2.5 text-[13.5px] font-light text-paragraph">
              <div className="flex justify-between"><span>Subtotal</span><span>{DisplayPriceInBdt(subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{shippingCost === 0 ? "Free" : DisplayPriceInBdt(shippingCost)}</span></div>
              <div className="flex justify-between"><span>Gift wrap</span><span>Free</span></div>
            </div>
            <div className="flex justify-between items-baseline border-t border-primary-hover mt-4 pt-4">
              <span className="text-[13px] tracking-[.14em] text-accent">TOTAL</span>
              <span className="font-secondary text-2xl text-title">{DisplayPriceInBdt(grandTotal)}</span>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full mt-5 bg-secondary hover:bg-secondary-hover disabled:opacity-60 text-background h-13 text-[11.5px] tracking-[.18em] transition-colors"
            >
              {ctaLabel}
            </button>
          </aside>
        </form>
      </div>
    </section>
  );
};

export default CheckoutPage;
