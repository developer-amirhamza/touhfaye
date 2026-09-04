"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PortalGuard from "../../PortalGuard";
import { ROLES, TRADE_FAMILY } from "@/utils/roles";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { SummeryApi } from "@/app/common/SummeryApi";

function SitesInner() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ label: "", address: "", phone: "", contact: "", isDefault: false });

  const load = () => {
    setLoading(true);
    Axios({ ...SummeryApi.listDeliverySites })
      .then((res) => res.data?.success && setSites(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const add = async () => {
    if (!form.label || !form.address) return toast.error("Label and address are required");
    try {
      setBusy(true);
      const res = await Axios({ ...SummeryApi.upsertDeliverySite, data: form });
      if (res.data?.success) {
        toast.success("Site added");
        setForm({ label: "", address: "", phone: "", contact: "", isDefault: false });
        load();
      }
    } catch (e) {
      AxiosToastError(e);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await Axios({ ...SummeryApi.deleteDeliverySite, data: { id } });
      if (res.data?.success) {
        toast.success("Site removed");
        load();
      }
    } catch (e) {
      AxiosToastError(e);
    }
  };

  const makeDefault = async (id: string) => {
    try {
      const res = await Axios({ ...SummeryApi.upsertDeliverySite, data: { id, isDefault: true } });
      if (res.data?.success) load();
    } catch (e) {
      AxiosToastError(e);
    }
  };

  const input = "w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#1a56db] text-sm";

  return (
    <div className="p-8 max-w-3xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Wholesale</p>
      <h1 className="font-serif text-4xl text-gray-900 mt-1 mb-2">Delivery sites</h1>
      <p className="text-sm text-gray-500 mb-6">
        Manage multiple delivery locations on one account — handy for multi-site organisations.
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 grid gap-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input placeholder="Site label (e.g. North branch)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={input} />
          <input placeholder="Contact name" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className={input} />
        </div>
        <input placeholder="Delivery address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={input} />
        <div className="grid sm:grid-cols-2 gap-3">
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Set as default site
          </label>
        </div>
        <button
          onClick={add}
          disabled={busy}
          className="self-start bg-[#1a1a18] text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-[#33312c] disabled:opacity-50"
        >
          Add site
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : sites.length === 0 ? (
        <p className="text-gray-400">No delivery sites yet.</p>
      ) : (
        <div className="grid gap-3">
          {sites.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{s.label}</span>
                  {s.isDefault && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Default</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{s.address}</p>
                <p className="text-xs text-gray-400">{[s.contact, s.phone].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0 text-right">
                {!s.isDefault && (
                  <button onClick={() => makeDefault(s.id)} className="text-[#1a56db] hover:underline text-xs">
                    Make default
                  </button>
                )}
                <button onClick={() => remove(s.id)} className="text-red-500 hover:underline text-xs">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TradeSitesPage() {
  return (
    <PortalGuard allow={[...TRADE_FAMILY, ROLES.ADMIN]}>
      <SitesInner />
    </PortalGuard>
  );
}