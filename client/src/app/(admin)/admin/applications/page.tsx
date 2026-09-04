"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { SummeryApi } from "@/app/common/SummeryApi";
import { TRADE_FAMILY } from "@/utils/roles";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-AU");
const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Axios({
      ...SummeryApi.listApplications,
      params: filter === "ALL" ? {} : { status: filter },
    })
      .then((res) => res.data?.success && setApps(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const approve = async (id: string, creditApproved: boolean) => {
    let creditLimit: number | undefined;
    if (creditApproved) {
      const input = window.prompt("30-day invoice credit limit ($)", "5000");
      if (input === null) return;
      creditLimit = Number(input) || 0;
    }
    try {
      setBusyId(id);
      const res = await Axios({ ...SummeryApi.approveApplication, data: { id, creditApproved, creditLimit } });
      if (res.data?.success) {
        toast.success("Approved");
        load();
      }
    } catch (e) {
      AxiosToastError(e);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    const notes = window.prompt("Reason for rejection (optional)") ?? "";
    try {
      setBusyId(id);
      const res = await Axios({ ...SummeryApi.rejectApplication, data: { id, notes } });
      if (res.data?.success) {
        toast.success("Rejected");
        load();
      }
    } catch (e) {
      AxiosToastError(e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Account applications</h1>
      <p className="text-sm text-gray-500 mb-5">Review and approve Retailer, Distributor, Trade & NDIS coordinator applications.</p>

      <div className="flex gap-2 mb-4">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              filter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : apps.length === 0 ? (
        <p className="text-gray-400">No applications.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Applicant</th>
                <th className="text-left px-4 py-3">Requested</th>
                <th className="text-left px-4 py-3">Business / Org</th>
                <th className="text-left px-4 py-3">ABN</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-t border-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{a.user?.name}</div>
                    <div className="text-xs text-gray-400">{a.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.requestedRole}</td>
                  <td className="px-4 py-3 text-gray-500">{a.businessName || a.organisation || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{a.abn || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{fmt(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${statusColor[a.status] ?? ""}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {a.status === "PENDING" ? (
                      <>
                        <button
                          disabled={busyId === a.id}
                          onClick={() => approve(a.id, false)}
                          className="text-green-600 hover:underline text-xs mr-2"
                        >
                          Approve
                        </button>
                        {TRADE_FAMILY.includes(a.requestedRole) && (
                          <button
                            disabled={busyId === a.id}
                            onClick={() => approve(a.id, true)}
                            className="text-[#1a56db] hover:underline text-xs mr-2"
                          >
                            Approve + credit
                          </button>
                        )}
                        <button
                          disabled={busyId === a.id}
                          onClick={() => reject(a.id)}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {a.creditApproved ? `Credit ✓${a.creditLimit ? ` ($${a.creditLimit})` : ""}` : "—"}
                      </span>
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