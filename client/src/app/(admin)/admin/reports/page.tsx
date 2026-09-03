"use client";
import { useEffect, useMemo, useState } from "react";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import toast from "react-hot-toast";
import { format } from "date-fns";

const money = (n: number) => `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;

// Derive the sales channel from the order's number prefix / payment method.
const channelOf = (o: any): string => {
  const n = (o.orderNumber || "").toUpperCase();
  if (n.startsWith("TRD")) return "Trade";
  if (n.startsWith("SUB")) return "Subscription";
  if (o.paymentMethod === "NDIS Quote") return "NDIS";
  return "Consumer";
};

const CHANNELS = ["Consumer", "Trade", "NDIS", "Subscription"];

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    Axios({ ...SummeryApi.fetchAllOrdersByAdmin })
      .then((res) => {
        const data = res.data?.data ?? [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Orders narrowed by the active filters — every stat and the export use this.
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const created = new Date(o.createdAt);
      if (startDate && created < new Date(`${startDate}T00:00:00`)) return false;
      if (endDate && created > new Date(`${endDate}T23:59:59.999`)) return false;
      if (channelFilter !== "ALL" && channelOf(o) !== channelFilter) return false;
      if (statusFilter !== "ALL" && (o.orderStatus || "").toLowerCase() !== statusFilter.toLowerCase()) return false;
      return true;
    });
  }, [orders, startDate, endDate, channelFilter, statusFilter]);

  const stats = useMemo(() => {
    const byChannel: Record<string, { count: number; revenue: number }> = {};
    const byProduct: Record<string, { name: string; qty: number; revenue: number }> = {};
    let totalRevenue = 0;

    for (const o of filteredOrders) {
      const ch = channelOf(o);
      byChannel[ch] ??= { count: 0, revenue: 0 };
      byChannel[ch].count += 1;
      byChannel[ch].revenue += o.total ?? 0;
      totalRevenue += o.total ?? 0;

      for (const it of o.items ?? []) {
        byProduct[it.productId] ??= { name: it.productName, qty: 0, revenue: 0 };
        byProduct[it.productId].qty += it.quantity ?? 0;
        byProduct[it.productId].revenue += it.total ?? 0;
      }
    }

    const topProducts = Object.values(byProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return { byChannel, topProducts, totalRevenue, orderCount: filteredOrders.length };
  }, [filteredOrders]);

  // Export the filtered report as a multi-sheet Excel workbook:
  // Summary · Sales by channel · Top products · Orders detail.
  const handleExport = async () => {
    try {
      setExporting(true);
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const rangeLabel = `${startDate || "beginning"} → ${endDate || "today"}`;
      const summary = XLSX.utils.json_to_sheet([
        { Metric: "Report period", Value: rangeLabel },
        { Metric: "Channel filter", Value: channelFilter },
        { Metric: "Status filter", Value: statusFilter },
        { Metric: "Total revenue", Value: stats.totalRevenue.toFixed(2) },
        { Metric: "Orders", Value: stats.orderCount },
        { Metric: "Avg. order value", Value: (stats.orderCount ? stats.totalRevenue / stats.orderCount : 0).toFixed(2) },
      ]);
      summary["!cols"] = [{ wch: 20 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, summary, "Summary");

      const channels = XLSX.utils.json_to_sheet(
        Object.entries(stats.byChannel).map(([ch, v]) => ({
          Channel: ch, Orders: v.count, Revenue: +v.revenue.toFixed(2),
        }))
      );
      channels["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, channels, "Sales by channel");

      const products = XLSX.utils.json_to_sheet(
        stats.topProducts.map((p) => ({
          Product: p.name, "Units sold": p.qty, Revenue: +p.revenue.toFixed(2),
        }))
      );
      products["!cols"] = [{ wch: 42 }, { wch: 12 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, products, "Top products");

      const detail = XLSX.utils.json_to_sheet(
        filteredOrders.map((o) => ({
          "Order #": o.orderNumber,
          Date: o.createdAt ? format(new Date(o.createdAt), "dd MMM yyyy") : "",
          Customer: o.name || "",
          Email: o.email || "",
          Channel: channelOf(o),
          Items: (o.items ?? []).reduce((s: number, i: any) => s + (i.quantity ?? 0), 0),
          Subtotal: +(o.subtotal ?? 0).toFixed(2),
          Delivery: +(o.shippingCost ?? 0).toFixed(2),
          Tax: +(o.tax ?? 0).toFixed(2),
          Total: +(o.total ?? 0).toFixed(2),
          "Order Status": o.orderStatus,
          "Payment Status": o.paymentStatus,
        }))
      );
      detail["!cols"] = [
        { wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 8 },
        { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, detail, "Orders detail");

      XLSX.writeFile(wb, `sales-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success(`Report exported (${filteredOrders.length} orders)`);
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Loading reports…</div>;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <button
          onClick={handleExport}
          disabled={exporting || filteredOrders.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-50"
        >
          {exporting ? "Exporting…" : "⬇ Export to Excel"}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Sales by channel, top products and account activity.</p>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Start date</label>
          <input type="date" value={startDate} max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">End date</label>
          <input type="date" value={endDate} min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Channel</label>
          <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All channels</option>
            {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Order status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => { setStartDate(""); setEndDate(""); setChannelFilter("ALL"); setStatusFilter("ALL"); }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
            Clear filters
          </button>
        </div>
        <p className="text-xs text-gray-500 sm:col-span-2 lg:col-span-5">
          Showing {filteredOrders.length} of {orders.length} orders
          {(startDate || endDate) && ` · ${startDate || "beginning"} → ${endDate || "today"}`}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Kpi label="Total revenue" value={money(stats.totalRevenue)} />
        <Kpi label="Orders" value={String(stats.orderCount)} />
        <Kpi
          label="Avg. order value"
          value={money(stats.orderCount ? stats.totalRevenue / stats.orderCount : 0)}
        />
      </div>

      {/* Sales by channel */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Sales by channel</h2>
        {Object.keys(stats.byChannel).length === 0 ? (
          <p className="text-sm text-gray-400">No orders in this period.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats.byChannel).map(([ch, v]) => (
              <div key={ch} className="border border-gray-100 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">{ch}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{money(v.revenue)}</p>
                <p className="text-xs text-gray-500">{v.count} order(s)</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top products */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Top products</h2>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-gray-400">No sales in this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left py-2">Product</th>
                <th className="text-right py-2">Units sold</th>
                <th className="text-right py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProducts.map((p, i) => (
                <tr key={i} className="border-t border-gray-50">
                  <td className="py-2 text-gray-700">{p.name}</td>
                  <td className="py-2 text-right text-gray-500">{p.qty}</td>
                  <td className="py-2 text-right text-gray-700">{money(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
