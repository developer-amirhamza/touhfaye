"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { SummeryApi } from "@/app/common/SummeryApi";

interface Tier {
  minQuantity: number;
  pricePerUnit: number;
  label?: string;
}
interface TradeProduct {
  id: string;
  title: string;
  images: string[];
  tradePrice: number;
  stock: number;
  tiers: Tier[];
}

// NaN-safe formatter — `?? 0` alone does NOT catch NaN (only null/undefined),
// so a cleared/invalid quantity input used to render "$NaN" in the order panel.
const money = (n: number) => `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;

// Resolve the unit price for a given carton quantity using the volume tiers.
const priceForQty = (p: TradeProduct, qty: number) => {
  const applicable = [...p.tiers]
    .filter((t) => qty >= t.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0];
  const price = applicable ? applicable.pricePerUnit : p.tradePrice;
  return Number.isFinite(price) ? price : 0;
};

export default function TradeCatalogue() {
  const [products, setProducts] = useState<TradeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [shippingAddress, setShippingAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Card" | "Invoice">("Card");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    Axios({ ...SummeryApi.getTradeCatalogue })
      .then((res) => res.data?.success && setProducts(res.data.data || []))
      .catch((e) => AxiosToastError(e))
      .finally(() => setLoading(false));
  }, []);

  const setQty = (id: string, qty: number) =>
    setCart((c) => {
      const next = { ...c };
      // Guard against NaN from a cleared/invalid number input — without this,
      // an empty cartons field would store NaN and silently poison the totals.
      const safeQty = Number.isFinite(qty) ? Math.max(0, Math.floor(qty)) : 0;
      if (safeQty <= 0) delete next[id];
      else next[id] = safeQty;
      return next;
    });

  const cartLines = useMemo(
    () =>
      Object.entries(cart).map(([productId, quantity]) => {
        const p = products.find((x) => x.id === productId)!;
        const unit = p ? priceForQty(p, quantity) : 0;
        return { product: p, quantity, unit, total: unit * quantity };
      }),
    [cart, products]
  );

  const subtotal = cartLines.reduce((s, l) => s + l.total, 0);

  const placeOrder = async () => {
    if (cartLines.length === 0) return toast.error("Your order is empty");
    if (!shippingAddress || !phone) return toast.error("Add a delivery address and phone");
    try {
      setPlacing(true);
      const res = await Axios({
        ...SummeryApi.placeTradeOrder,
        data: {
          lines: Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity })),
          shippingAddress,
          phone,
          paymentMethod,
        },
      });
      if (res.data?.success) {
        toast.success(`Order ${res.data.data.orderNumber} placed`);
        setCart({});
      }
    } catch (e) {
      AxiosToastError(e);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Wholesale</p>
      <h1 className="font-serif text-4xl text-gray-900 mt-1 mb-6">Wholesale catalogue</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product list */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {loading ? (
            <p className="text-gray-400">Loading catalogue…</p>
          ) : products.length === 0 ? (
            <p className="text-gray-400">No products available.</p>
          ) : (
            products.map((p) => {
              const qty = cart[p.id] ?? 0;
              const unit = priceForQty(p, Math.max(1, qty));
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="font-medium text-gray-800 text-sm leading-snug">{p.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">In stock: {p.stock}</p>
                    </div>
                    <span className="font-serif text-lg text-[#1a56db] whitespace-nowrap">{money(unit)}</span>
                  </div>

                  {/* Volume tiers */}
                  {p.tiers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.tiers.map((t, i) => (
                        <span
                          key={i}
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            qty >= t.minQuantity ? "bg-[#1a56db] text-white" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {t.minQuantity}+ → {money(t.pricePerUnit)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Carton quantity stepper */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">Cartons</span>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden ml-auto">
                      <button onClick={() => setQty(p.id, qty - 1)} className="px-3 py-1 text-gray-500 hover:bg-gray-50">−</button>
                      <input
                        type="number"
                        min={0}
                        value={qty}
                        onChange={(e) => setQty(p.id, Number(e.target.value))}
                        className="w-12 text-center text-sm outline-none"
                      />
                      <button onClick={() => setQty(p.id, qty + 1)} className="px-3 py-1 text-gray-500 hover:bg-gray-50">+</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Order panel */}
        <div className="bg-[#1a1a18] text-white rounded-2xl p-6 flex flex-col gap-3 h-fit sticky top-6">
          <h3 className="font-serif text-xl mb-1">Your order</h3>
          {cartLines.length === 0 ? (
            <p className="text-sm text-gray-400">Add cartons to build an order.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {cartLines.map((l) => (
                <div key={l.product?.id} className="flex justify-between text-sm">
                  <span className="text-gray-300 truncate pr-2">
                    {l.product?.title} × {l.quantity}
                  </span>
                  <span className="whitespace-nowrap">{money(l.total)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 my-2" />
              <div className="flex justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <p className="text-[11px] text-gray-400">Delivery & GST calculated at confirmation.</p>
            </div>
          )}

          <input
            placeholder="Delivery address"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            className="mt-3 w-full p-2.5 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#c9b89a]"
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2.5 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#c9b89a]"
          />

          <div className="flex gap-2 mt-1">
            {(["Card", "Invoice"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  paymentMethod === m ? "bg-[#c9b89a] text-[#1a1a18] border-[#c9b89a]" : "border-white/30 text-gray-300"
                }`}
              >
                {m === "Card" ? "Pay by card" : "30-day invoice"}
              </button>
            ))}
          </div>
          {paymentMethod === "Invoice" && (
            <p className="text-[11px] text-gray-400">30-day invoicing requires an approved credit account.</p>
          )}

          <button
            onClick={placeOrder}
            disabled={placing || cartLines.length === 0}
            className="mt-3 bg-[#c9b89a] text-[#1a1a18] font-semibold text-sm py-2.5 rounded-full hover:bg-[#b8a489] transition-colors disabled:opacity-50"
          >
            {placing ? "Placing…" : "Place trade order"}
          </button>
        </div>
      </div>
    </div>
  );
}