"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/redux/store";
import { createCheckoutSession, clearStripeUrl, placeOrder } from "@/redux/slices/orderSlice";
import { fetchCart } from "@/redux/slices/cartSlice";
import { DisplayPriceInAud } from "@/utils/DisplayPriceInAud";
import { normaliseRole, portalPath, ROLES } from "@/utils/roles";
import { planForDays } from "@/config/subscriptionPlans";
import Link from "next/link";
import toast from "react-hot-toast";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  // orderNote:string;
}

// Payment methods. CARD keeps the existing Stripe redirect; NDIS and HCP
// complete the order without instant payment, against the participant's funding.
type PayMethod = "CARD" | "NDIS" | "HCP";

const NDIS_FUNDING_TYPES = ["Self-Managed", "Plan-Managed", "NDIA-Managed"];

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
    state: "",
    pincode: "",
    country: "",
    // orderNote:"",
  });

  const [payMethod, setPayMethod] = useState<PayMethod>("CARD");
  const [orderNote, setOrderNote] = useState("")

  // NDIS participant funding details
  const [ndis, setNdis] = useState({
    participantName: "",
    ndisNumber: "",
    dob: "",
    fundingType: "",
    approved: false,
  });

  // Home Care Package funding details
  const [hcp, setHcp] = useState({
    participantName: "",
    hcpNumber: "",
    providerEmail: "",
    approved: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill user data if logged in
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

  // Fetch cart if idle
  useEffect(() => {
    if (cartStatus === "idle") {
      dispatch(fetchCart());
    }
  }, [cartStatus, dispatch]);

  // Redirect to Stripe when URL is ready
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

  const splitName = (full: string) => {
    const parts = full.trim().split(/\s+/);
    return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName,lastName, email, phone, addressLine, city, state, pincode, country } = form;
    if (!firstName || !email || !phone || !addressLine || !city || !state || !pincode || !country) {
      toast.error("Please fill all billing and shipping fields");
      return;
    }
    const shippingAddress = `${addressLine}, ${city}, ${state}, ${pincode}, ${country}`;

    // ── Funding orders: validate here, then place the order without payment ──
    if (payMethod === "NDIS") {
      if (!ndis.participantName || !ndis.ndisNumber || !ndis.dob || !ndis.fundingType) {
        toast.error("Please complete all NDIS participant details");
        return;
      }
      if (!ndis.approved) {
        toast.error("Please approve payment from the participant's NDIS funding");
        return;
      }
    }
    if (payMethod === "HCP") {
      if (!hcp.participantName || !hcp.hcpNumber || !hcp.providerEmail) {
        toast.error("Please complete all Home Care Package details");
        return;
      }
      if (!hcp.approved) {
        toast.error("Please approve payment from the participant's HCP funding");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (payMethod === "CARD") {
        await dispatch(
          createCheckoutSession({ firstName, lastName, email, phone, shippingAddress,orderNote } as any)
        ).unwrap();
        // The stripeUrl effect handles the redirect.
      } else {
        await dispatch(
          placeOrder({
            firstName,
            lastName,
            email,
            phone,
            shippingAddress,
            orderNote:orderNote || "",
            paymentMethod: payMethod,
            fundingDetails: payMethod === "NDIS" ? ndis : hcp,
          })
        ).unwrap();
        toast.success("Order placed — we'll process your funding claim.");
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
      <div className="text-center py-20">
        <p className="text-neutral-500">Your cart is empty.</p>
        <a href="/products" className="text-blue-600 underline mt-2 inline-block">Continue Shopping</a>
      </div>
    );
  }

  // Calculate totals
  let subtotal = 0;
  let totalQty = 0;
  let grandTotal = 0;
  let totalDiscount = 0;

  for (const item of cart.items) {
    // displayPrice is already the buyer's own role price (or the main price
    // minus its retail discount) — only the "Subscribe & Save" interval
    // discount still needs applying on top of it here.
    const price = (item as any).displayPrice ?? item.product.price;
    const subscriptionPlan = planForDays(item.subscriptionIntervalDays);
    const effectivePct = subscriptionPlan ? subscriptionPlan.discountPct : 0;
    const discountedPrice = price - (price * effectivePct) / 100;
    const itemTotal = discountedPrice * item.quantity;
    const itemOriginalTotal = price * item.quantity;
    subtotal += itemOriginalTotal;
    totalQty += item.quantity;
    totalDiscount += itemOriginalTotal - itemTotal;
    grandTotal += itemTotal;
  }

  const role = normaliseRole(user?.role);
  const hasPortal = role === ROLES.TRADE || role === ROLES.NDIS_COORDINATOR;

  const fieldCls =
    "w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-secondary";
  const busy = isSubmitting || orderStatus === "loading";

  const ctaLabel = busy
    ? "Processing..."
    : payMethod === "CARD"
    ? "Proceed to Payment"
    : payMethod === "NDIS"
    ? "Complete order with NDIS funding"
    : "Complete order with HCP funding";

  return (
    <section className="bg-blue-50 min-h-screen py-8">
      <div className="container mx-auto p-4">
        {hasPortal && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              You're checking out at <b>retail price</b>. Your{" "}
              {role === ROLES.TRADE ? "trade wholesale pricing" : "NDIS quote pricing"} is
              only available in your portal.
            </p>
            <Link
              href={portalPath(role)}
              className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Go to my portal →
            </Link>
          </div>
        )}
      </div>

      <div className="container mx-auto gap-6 flex flex-col lg:flex-row items-start justify-between p-4">
        {/* Checkout Form */}
        <div className="w-full bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">Billing Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-5 w-full ">
              <div className="grid w-full">
              <label className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
              <input type="text" name="firstName" value={form.firstName} onChange={handleInputChange} required className={fieldCls} />
            </div>
            <div className="grid w-full">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
              <input type="text" name="lastName" value={form.lastName} onChange={handleInputChange} required className={fieldCls} />
            </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleInputChange} required className={fieldCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleInputChange} required className={fieldCls} />
            </div>

            <div className="border-t pt-4 mt-2">
              <h3 className="font-medium text-neutral-800 mb-3">Shipping Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Address Line</label>
                  <input type="text" name="addressLine" placeholder="Street, House No., Apartment" value={form.addressLine} onChange={handleInputChange} required className={fieldCls} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">City / Suburb</label>
                    <input type="text" name="city" placeholder="Suburb" value={form.city} onChange={handleInputChange} required className={fieldCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">State</label>
                    <input type="text" name="state" placeholder="State" value={form.state} onChange={handleInputChange} required className={fieldCls} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Postcode</label>
                    <input type="text" name="pincode" placeholder="Postcode" value={form.pincode} onChange={handleInputChange} required className={fieldCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Country</label>
                    <input type="text" name="country" placeholder="Country" value={form.country} onChange={handleInputChange} required className={fieldCls} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Payment method ── */}
            <div className="border-t pt-4 mt-2">
              <h3 className="font-medium text-neutral-800 mb-3">Payment method</h3>
              <div className="space-y-2">
                <PayOption
                  label="Pay now by card"
                  desc="Secure card payment via Stripe."
                  active={payMethod === "CARD"}
                  onClick={() => setPayMethod("CARD")}
                />
                <PayOption
                  label="NDIS Payment"
                  desc="Complete your order now — paid from the participant's NDIS funding, no card needed."
                  active={payMethod === "NDIS"}
                  onClick={() => setPayMethod("NDIS")}
                />
                <PayOption
                  label="Home Care Package Payment"
                  desc="Complete your order now — paid from the participant's HCP funding, no card needed."
                  active={payMethod === "HCP"}
                  onClick={() => setPayMethod("HCP")}
                />
              </div>
            </div>

            {/* ── NDIS information ── */}
            {payMethod === "NDIS" && (
              <div className="rounded-lg border-2 border-purple-300 bg-purple-50/60 p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-purple-800">Enter your NDIS information</h3>
                  <p className="text-xs text-purple-700">
                    Are you an NDIS participant or acting on behalf of one? Add the participant's details to pay from their NDIS funding.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Participant's Full Name</label>
                  <input className={fieldCls} value={ndis.participantName} onChange={(e) => setNdis({ ...ndis, participantName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">NDIS Number</label>
                  <input className={fieldCls} value={ndis.ndisNumber} onChange={(e) => setNdis({ ...ndis, ndisNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Participant's Date Of Birth</label>
                  <input type="date" className={fieldCls} value={ndis.dob} onChange={(e) => setNdis({ ...ndis, dob: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">NDIS Funding Type</label>
                  <select className={fieldCls} value={ndis.fundingType} onChange={(e) => setNdis({ ...ndis, fundingType: e.target.value })}>
                    <option value="">Please Choose</option>
                    {NDIS_FUNDING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <label className="flex items-start gap-2 pt-1">
                  <input type="checkbox" className="mt-1 accent-purple-600" checked={ndis.approved} onChange={(e) => setNdis({ ...ndis, approved: e.target.checked })} />
                  <span className="text-xs text-neutral-700">
                    <b>Authorized Person / Guardian Approval:</b> I approve this order to be paid using my / the participant's NDIS funding.
                  </span>
                </label>
              </div>
            )}

            {/* ── HCP information ── */}
            {payMethod === "HCP" && (
              <div className="rounded-lg border-2 border-amber-300 bg-amber-50/70 p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-amber-800">Enter your Home Care Package information</h3>
                  <p className="text-xs text-amber-700">
                    Caring for someone with a Home Care Package? Enter their provider details to pay from their package.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Participant's Full Name</label>
                  <input className={fieldCls} value={hcp.participantName} onChange={(e) => setHcp({ ...hcp, participantName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">HCP Number</label>
                  <input className={fieldCls} value={hcp.hcpNumber} onChange={(e) => setHcp({ ...hcp, hcpNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Provider Payment Email</label>
                  <input type="email" className={fieldCls} value={hcp.providerEmail} onChange={(e) => setHcp({ ...hcp, providerEmail: e.target.value })} />
                </div>
                <label className="flex items-start gap-2 pt-1">
                  <input type="checkbox" className="mt-1 accent-amber-600" checked={hcp.approved} onChange={(e) => setHcp({ ...hcp, approved: e.target.checked })} />
                  <span className="text-xs text-neutral-700">
                    <b>Authorized Person / Guardian Approval:</b> I approve this order to be paid using my / the participant's HCP funding.
                  </span>
                </label>
              </div>
            )}
          </form>
        </div>

        <div className="w-full lg:max-w-md grid gap-6 ">
           <div className="w-full lg:max-w-md bg-white rounded-md shadow p-5  " >
          {/* Admin Note about the order */}
            <div className="">
                <label className="block text-xl font-semibold text-gray-700 mb-2">
                    Order Note
                </label>
                <textarea name="orderNote" id="orderNote"
                  value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Write a note (optional)"
                    className="w-full px-3  border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
                />
            </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:max-w-md bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">Order Summary</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Subtotal</span>
              <span className="font-medium">{DisplayPriceInAud(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Discount</span>
              <span className="text-green-600">- {DisplayPriceInAud(totalDiscount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Total Quantity</span>
              <span className="font-medium">{totalQty} items</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Grand Total</span>
                <span>{DisplayPriceInAud(grandTotal)}</span>
              </div>
            </div>

            {payMethod !== "CARD" && (
              <p className="rounded-md bg-background text-blue-800 text-xs px-3 py-2">
                {payMethod === "NDIS"
                  ? "You're paying with NDIS funding — no card charge now. We'll process the claim and dispatch your order."
                  : "You're paying with your Home Care Package — no card charge now. We'll invoice the provider and dispatch your order."}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={busy}
              className="w-full mt-4 bg-secondary-hover hover:bg-secondary text-white font-semibold py-2 px-4 rounded-md transition disabled:bg-gray-400"
            >
              {ctaLabel}
            </button>
            <p className="text-center text-[11px] text-neutral-400">🔒 100% secure • Tax included where applicable</p>
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};

// Selectable payment-method row.
function PayOption({
  label, desc, active, onClick,
}: { label: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-3 transition ${
        active ? "border-secondary bg-background ring-1 ring-secondary-hover" : "border-gray-300 hover:border-primary-hover"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${active ? "border-primary-hover" : "border-gray-400"}`}>
          {active && <span className="h-2 w-2 rounded-full bg-secondary" />}
        </span>
        <span className="font-medium text-neutral-800 text-sm">{label}</span>
      </div>
      <p className="text-xs text-neutral-500 mt-1 ml-6">{desc}</p>
    </button>
  );
}

export default CheckoutPage;
