"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { SummeryApi } from "@/app/common/SummeryApi";

const money = (n: number) => `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
const fmt = (d: string) => new Date(d).toLocaleDateString("en-AU");

export default function ConsumerOrders() {
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
      const res = await Axios({ ...SummeryApi.oneClickReorder, data: { orderId } });
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">My Account</p>
      <h1 className="font-serif text-4xl text-gray-900 mt-1 mb-4">My orders</h1>

      {/* Discreet / privacy reassurance */}
      <div className="flex items-center gap-3 bg-[#e8ddd4] rounded-2xl px-5 py-4 mb-6">
        <span className="text-xl">📦</span>
        <p className="text-sm text-[#5c4a38]">
          Every order ships in <b>plain, unmarked packaging</b>. Your privacy is always protected.
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <Link
          href="/portal/consumer/subscriptions"
          className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#1a1a18] text-white hover:bg-[#33312c]"
        >
          Manage subscriptions
        </Link>
        <Link
          href="/product-finder"
          className="px-5 py-2.5 rounded-full text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Find my size
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-400">You have no orders yet.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Date</th>
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
                  <td className="px-4 py-3 text-gray-500">{o.orderStatus}</td>
                  <td className="px-4 py-3 text-right">{money(o.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={busyId === o.id}
                      onClick={() => reorder(o.id)}
                      className="text-secondary-hover hover:underline text-xs font-semibold disabled:opacity-50"
                    >
                      {busyId === o.id ? "…" : "Reorder"}
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
