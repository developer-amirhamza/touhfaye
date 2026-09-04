"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PortalGuard from "../../PortalGuard";
import { ROLES, TRADE_FAMILY } from "@/utils/roles";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { SummeryApi } from "@/app/common/SummeryApi";

const money = (n: number) => `$${(n ?? 0).toFixed(2)}`;
const fmt = (d: string) => new Date(d).toLocaleDateString("en-AU");

function OrdersInner() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Axios({ ...SummeryApi.fetchMyOrders })
      .then((res) => {
        const data = res.data?.data ?? [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const reorder = async (orderId: string) => {
    try {
      setBusyId(orderId);
      const res = await Axios({ ...SummeryApi.quickReorder, data: { orderId } });
      if (res.data?.success) {
        toast.success(`Reordered as ${res.data.data.orderNumber}`);
        load();
      }
    } catch (e) {
      AxiosToastError(e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Wholesale</p>
      <h1 className="font-serif text-4xl text-gray-900 mt-1 mb-6">Order history</h1>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-400">No orders yet.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Payment</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{fmt(o.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-500">{o.paymentMethod}</td>
                  <td className="px-4 py-3 text-gray-500">{o.orderStatus}</td>
                  <td className="px-4 py-3 text-right">{money(o.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={busyId === o.id}
                      onClick={() => reorder(o.id)}
                      className="text-[#1a56db] hover:underline text-xs font-semibold disabled:opacity-50"
                    >
                      {busyId === o.id ? "…" : "Quick reorder"}
                    </button>
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

export default function TradeOrdersPage() {
  return (
    <PortalGuard allow={[...TRADE_FAMILY, ROLES.ADMIN]}>
      <OrdersInner />
    </PortalGuard>
  );
}