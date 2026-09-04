"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PortalGuard from "../../PortalGuard";
import { ROLES } from "@/utils/roles";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { SummeryApi } from "@/app/common/SummeryApi";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-AU");
const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

interface Product { id: string; title: string; }

function SubscriptionsInner() {
  const [subs, setSubs] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const [intervalDays, setIntervalDays] = useState(30);
  const [shippingAddress, setShippingAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [lines, setLines] = useState<{ productId: string; quantity: number }[]>([
    { productId: "", quantity: 1 },
  ]);

  const load = () => {
    setLoading(true);
    Axios({ ...SummeryApi.listSubscriptions })
      .then((res) => res.data?.success && setSubs(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    Axios({ ...SummeryApi.fetchProducts })
      .then((res) => res.data?.success && setProducts((res.data.data || []).map((p: any) => ({ id: p.id, title: p.title }))))
      .catch(() => {});
  }, []);

  const setStatus = async (id: string, status: string) => {
    try {
      setBusy(true);
      const res = await Axios({ ...SummeryApi.upsertSubscription, data: { id, status } });
      if (res.data?.success) {
        toast.success("Updated");
        load();
      }
    } catch (e) {
      AxiosToastError(e);
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0 || !shippingAddress || !phone)
      return toast.error("Add products, address and phone");
    try {
      setBusy(true);
      const res = await Axios({
        ...SummeryApi.upsertSubscription,
        data: { intervalDays, shippingAddress, phone, items: validLines },
      });
      if (res.data?.success) {
        toast.success("Subscription created");
        setCreating(false);
        setLines([{ productId: "", quantity: 1 }]);
        setShippingAddress("");
        setPhone("");
        load();
      }
    } catch (e) {
      AxiosToastError(e);
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#1a56db] text-sm";

  return (
    <div className="p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">My Account</p>
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-serif text-4xl text-gray-900 mt-1">Subscriptions</h1>
        <button
          onClick={() => setCreating((c) => !c)}
          className="px-5 py-2.5 rounded-full text-sm font-semibold bg-secondary-hover text-white hover:bg-secondary cursor-pointer"
        >
          {creating ? "Cancel" : "+ New subscription"}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Set up recurring auto-delivery so you never run out — pause, skip or cancel anytime.
      </p>

      {creating && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 grid gap-4 max-w-2xl">
          {lines.map((l, i) => (
            <div key={i} className="flex gap-3 items-end">
              <label className="flex-1 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-600">Product</span>
                <select
                  value={l.productId}
                  onChange={(e) =>
                    setLines(lines.map((x, idx) => (idx === i ? { ...x, productId: e.target.value } : x)))
                  }
                  className={input}
                >
                  <option value="">Select…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </label>
              <label className="w-24 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-600">Qty</span>
                <input
                  type="number"
                  min={1}
                  value={l.quantity}
                  onChange={(e) =>
                    setLines(lines.map((x, idx) => (idx === i ? { ...x, quantity: Number(e.target.value) } : x)))
                  }
                  className={input}
                />
              </label>
              <button onClick={() => setLines(lines.filter((_, idx) => idx !== i))} className="text-red-500 text-xs pb-3">
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => setLines([...lines, { productId: "", quantity: 1 }])}
            className="self-start text-sm font-semibold text-[#1a56db] hover:underline"
          >
            + Add product
          </button>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-600">Every (days)</span>
              <input type="number" min={1} value={intervalDays} onChange={(e) => setIntervalDays(Number(e.target.value))} className={input} />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-gray-600">Delivery address</span>
              <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className={input} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 max-w-xs">
            <span className="text-xs font-medium text-gray-600">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
          </label>
          <button
            onClick={create}
            disabled={busy}
            className="self-start bg-[#1a1a18] text-white font-semibold text-sm px-6 py-2.5 cursor-pointer rounded-full hover:bg-[#33312c] disabled:opacity-50"
          >
            Create subscription
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : subs.length === 0 ? (
        <p className="text-gray-400">No subscriptions yet.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Cadence</th>
                <th className="text-left px-4 py-3">Next delivery</th>
                <th className="text-left px-4 py-3">Items</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-t border-gray-50">
                  <td className="px-4 py-3 text-gray-600">Every {s.intervalDays} days</td>
                  <td className="px-4 py-3 text-gray-500">{fmt(s.nextRunAt)}</td>
                  <td className="px-4 py-3 text-gray-500">{Array.isArray(s.items) ? s.items.length : 0} line(s)</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${statusColor[s.status] ?? ""}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {s.status === "ACTIVE" ? (
                      <button disabled={busy} onClick={() => setStatus(s.id, "PAUSED")} className="text-yellow-600 hover:underline text-xs mr-3">
                        Pause
                      </button>
                    ) : s.status === "PAUSED" ? (
                      <button disabled={busy} onClick={() => setStatus(s.id, "ACTIVE")} className="text-green-600 hover:underline text-xs mr-3">
                        Resume
                      </button>
                    ) : null}
                    {s.status !== "CANCELLED" && (
                      <button disabled={busy} onClick={() => setStatus(s.id, "CANCELLED")} className="text-red-500 hover:underline text-xs">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ConsumerSubscriptionsPage() {
  return (
    <PortalGuard allow={[ROLES.CONSUMER, ROLES.ADMIN]}>
      <SubscriptionsInner />
    </PortalGuard>
  );
}