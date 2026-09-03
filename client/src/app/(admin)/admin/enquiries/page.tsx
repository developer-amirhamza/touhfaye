"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { SummeryApi } from "@/app/common/SummeryApi";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-AU");
const statusColor: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  RESOLVED: "bg-green-100 text-green-700",
};

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Axios({
      ...SummeryApi.listEnquiries,
      params: typeFilter === "ALL" ? {} : { type: typeFilter },
    })
      .then((res) => res.data?.success && setEnquiries(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [typeFilter]);

  const setStatus = async (id: string, status: string) => {
    try {
      setBusyId(id);
      const res = await Axios({ ...SummeryApi.updateEnquiryStatus, data: { id, status } });
      if (res.data?.success) {
        toast.success("Updated");
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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Enquiries</h1>
      <p className="text-sm text-gray-500 mb-5">Funding support and trade enquiries.</p>

      <div className="flex gap-2 mb-4">
        {["ALL", "FUNDING_SUPPORT", "TRADE", "GENERAL"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              typeFilter === t ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : enquiries.length === 0 ? (
        <p className="text-gray-400">No enquiries.</p>
      ) : (
        <div className="grid gap-3">
          {enquiries.map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {e.type.replace("_", " ")}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor[e.status] ?? ""}`}>
                      {e.status}
                    </span>
                    <span className="text-xs text-gray-400">{fmt(e.createdAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {e.name || "—"} {e.email && <span className="text-gray-400">· {e.email}</span>}
                    {e.phone && <span className="text-gray-400"> · {e.phone}</span>}
                  </p>
                  {e.participantNeed && <p className="text-sm text-gray-600 mt-1"><b>Need:</b> {e.participantNeed}</p>}
                  {e.availableFunding && <p className="text-sm text-gray-600"><b>Funding:</b> {e.availableFunding}</p>}
                  {e.message && <p className="text-sm text-gray-600 mt-1">{e.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {e.status !== "IN_PROGRESS" && (
                    <button disabled={busyId === e.id} onClick={() => setStatus(e.id, "IN_PROGRESS")} className="text-yellow-600 hover:underline text-xs">
                      Mark in progress
                    </button>
                  )}
                  {e.status !== "RESOLVED" && (
                    <button disabled={busyId === e.id} onClick={() => setStatus(e.id, "RESOLVED")} className="text-green-600 hover:underline text-xs">
                      Mark resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}