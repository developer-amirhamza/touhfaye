"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { SummeryApi } from "@/app/common/SummeryApi";

// Mirrors the backend SETTING_DEFAULTS.
const SETTING_FIELDS: { key: string; label: string; type: "number" | "bool" | "select"; opts?: string[]; hint?: string }[] = [
  { key: "gstEnabled", label: "GST enabled", type: "bool", hint: "Continence aids may be GST-free — confirm with the accountant." },
  { key: "gstRate", label: "GST rate (e.g. 0.10)", type: "number" },
  { key: "ndisAnnualDiscountPct", label: "NDIS annual discount %", type: "number" },
  { key: "consumerSubscriptionDiscountPct", label: "Subscription discount %", type: "number" },
  { key: "deliveryMode", label: "Delivery mode", type: "select", opts: ["FLAT", "POSTCODE"] },
  { key: "deliveryFlatFee", label: "Delivery flat fee ($)", type: "number" },
  { key: "freeDeliveryThreshold", label: "Free delivery over ($, 0 = off)", type: "number" },
];

export default function AdminPricingPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [tiers, setTiers] = useState<any[]>([]);
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // New tier form
  const [tier, setTier] = useState({ productId: "", minQuantity: 1, pricePerUnit: 0, label: "" });

  const loadAll = () => {
    Axios({ ...SummeryApi.getPricingSettings }).then((r) => r.data?.success && setSettings(r.data.data)).catch(() => {});
    Axios({ ...SummeryApi.listPricingTiers }).then((r) => r.data?.success && setTiers(r.data.data || [])).catch(() => {});
    Axios({ ...SummeryApi.fetchProducts })
      .then((r) => r.data?.success && setProducts((r.data.data || []).map((p: any) => ({ id: p.id, title: p.title }))))
      .catch(() => {});
  };
  useEffect(loadAll, []);

  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await Axios({ ...SummeryApi.updatePricingSettings, data: settings });
      if (res.data?.success) {
        toast.success("Settings saved");
        setSettings(res.data.data);
      }
    } catch (e) {
      AxiosToastError(e);
    } finally {
      setSaving(false);
    }
  };

  const addTier = async () => {
    if (tier.minQuantity <= 0 || tier.pricePerUnit <= 0) return toast.error("Enter quantity and price");
    try {
      const res = await Axios({
        ...SummeryApi.upsertPricingTier,
        data: { ...tier, productId: tier.productId || null, role: "TRADE" },
      });
      if (res.data?.success) {
        toast.success("Tier added");
        setTier({ productId: "", minQuantity: 1, pricePerUnit: 0, label: "" });
        loadAll();
      }
    } catch (e) {
      AxiosToastError(e);
    }
  };

  const deleteTier = async (id: string) => {
    try {
      const res = await Axios({ ...SummeryApi.deletePricingTier, data: { id } });
      if (res.data?.success) {
        toast.success("Tier deleted");
        loadAll();
      }
    } catch (e) {
      AxiosToastError(e);
    }
  };

  const input = "w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#1a56db] text-sm";
  const productTitle = (id: string | null) => (id ? products.find((p) => p.id === id)?.title ?? id : "All products");

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Pricing</h1>
      <p className="text-sm text-gray-500 mb-6">Everything here is editable — no prices are hard-coded.</p>

      {/* Settings */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Global settings</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {SETTING_FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-600">{f.label}</span>
              {f.type === "bool" ? (
                <select
                  value={String(settings[f.key] ?? false)}
                  onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value === "true" })}
                  className={input}
                >
                  <option value="true">On</option>
                  <option value="false">Off</option>
                </select>
              ) : f.type === "select" ? (
                <select
                  value={settings[f.key] ?? f.opts![0]}
                  onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                  className={input}
                >
                  {f.opts!.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  step="any"
                  value={settings[f.key] ?? 0}
                  onChange={(e) => setSettings({ ...settings, [f.key]: Number(e.target.value) })}
                  className={input}
                />
              )}
              {f.hint && <span className="text-[11px] text-gray-400">{f.hint}</span>}
            </label>
          ))}
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="mt-5 bg-[#1a56db] text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>

      {/* Volume tiers */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Trade volume tiers</h2>

        <div className="grid sm:grid-cols-5 gap-3 items-end mb-5">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-gray-600">Product</span>
            <select value={tier.productId} onChange={(e) => setTier({ ...tier, productId: e.target.value })} className={input}>
              <option value="">All products (default)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-600">Min cartons</span>
            <input type="number" min={1} value={tier.minQuantity} onChange={(e) => setTier({ ...tier, minQuantity: Number(e.target.value) })} className={input} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-600">Price / unit</span>
            <input type="number" step="any" value={tier.pricePerUnit} onChange={(e) => setTier({ ...tier, pricePerUnit: Number(e.target.value) })} className={input} />
          </label>
          <button onClick={addTier} className="bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-800">
            Add tier
          </button>
        </div>

        {tiers.length === 0 ? (
          <p className="text-sm text-gray-400">No tiers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left py-2">Product</th>
                <th className="text-left py-2">Min cartons</th>
                <th className="text-left py-2">Price / unit</th>
                <th className="text-right py-2"></th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.id} className="border-t border-gray-50">
                  <td className="py-2 text-gray-700">{productTitle(t.productId)}</td>
                  <td className="py-2 text-gray-500">{t.minQuantity}+</td>
                  <td className="py-2 text-gray-500">${t.pricePerUnit.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => deleteTier(t.id)} className="text-red-500 hover:underline text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}