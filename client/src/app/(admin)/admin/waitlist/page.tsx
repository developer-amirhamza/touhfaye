"use client";
import React, { useEffect, useMemo, useState } from "react";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface Entry {
    id: string;
    name: string;
    email: string;
    postcode: string;
    country: string;
    buyerType: string;
    consent: boolean;
    consentAt: string | null;
    utm: string | null;
    createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
    USER: "User / self",
    CARER: "Carer / family",
    PHARMACY: "Pharmacy",
    AGED_CARE: "Aged care",
    NDIS_PROVIDER: "NDIS provider",
    DISTRIBUTOR: "Distributor",
};

const B2B = new Set(["PHARMACY", "AGED_CARE", "NDIS_PROVIDER", "DISTRIBUTOR"]);

export default function AdminWaitlistPage() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [segment, setSegment] = useState<"ALL" | "B2B" | "CONSUMER">("ALL");
    const [exporting, setExporting] = useState(false);

    const fetchEntries = async () => {
        try {
            setLoading(true);
            const res = await Axios({ ...SummeryApi.listWaitlist });
            if (res.data?.success) setEntries(res.data.data || []);
        } catch (e) {
            AxiosToastError(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEntries(); }, []);

    const filtered = useMemo(() => {
        return entries.filter((e) => {
            if (search.trim()) {
                const q = search.toLowerCase();
                if (!e.name.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q) && !e.postcode.includes(q))
                    return false;
            }
            if (typeFilter !== "ALL" && e.buyerType !== typeFilter) return false;
            if (segment === "B2B" && !B2B.has(e.buyerType)) return false;
            if (segment === "CONSUMER" && B2B.has(e.buyerType)) return false;
            return true;
        });
    }, [entries, search, typeFilter, segment]);

    const stats = useMemo(() => ({
        total: entries.length,
        b2b: entries.filter((e) => B2B.has(e.buyerType)).length,
        consumer: entries.filter((e) => !B2B.has(e.buyerType)).length,
        consented: entries.filter((e) => e.consent).length,
    }), [entries]);

    const handleExport = async () => {
        try {
            setExporting(true);
            const XLSX = await import("xlsx");
            const rows = filtered.map((e) => ({
                Name: e.name,
                Email: e.email,
                Postcode: e.postcode,
                Country: e.country,
                "Buyer Type": TYPE_LABEL[e.buyerType] ?? e.buyerType,
                "B2B Lead": B2B.has(e.buyerType) ? "Yes" : "No",
                "Marketing Consent": e.consent ? "Yes" : "No",
                "Consent At": e.consentAt ? format(new Date(e.consentAt), "dd MMM yyyy HH:mm") : "",
                Source: e.utm || "direct",
                Joined: format(new Date(e.createdAt), "dd MMM yyyy HH:mm"),
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            ws["!cols"] = [
                { wch: 22 }, { wch: 30 }, { wch: 10 }, { wch: 14 }, { wch: 18 },
                { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 18 },
            ];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Waitlist");
            XLSX.writeFile(wb, `waitlist-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
            toast.success(`Exported ${rows.length} leads`);
        } catch (e) {
            console.error(e);
            toast.error("Export failed");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="container mx-auto p-4 py-8">
            <div className="flex flex-wrap items-start justify-between gap-3 mt-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Waitlist</h1>
                    <p className="text-sm text-gray-500">Pre-launch signups from the marketing popup.</p>
                </div>
                <button onClick={handleExport} disabled={exporting || loading || filtered.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-50">
                    {exporting ? "Exporting…" : "⬇ Export to Excel"}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                <Stat label="Total signups" value={stats.total} />
                <Stat label="B2B leads" value={stats.b2b} accent="text-[#C9573F]" />
                <Stat label="Consumers" value={stats.consumer} />
                <Stat label="Opted in" value={stats.consented} accent="text-[#2E7D71]" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, postcode…"
                    className="border border-gray-300 rounded px-3 py-2 text-sm w-64" />
                <select value={segment} onChange={(e) => setSegment(e.target.value as any)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm">
                    <option value="ALL">All segments</option>
                    <option value="B2B">B2B only</option>
                    <option value="CONSUMER">Consumers only</option>
                </select>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm">
                    <option value="ALL">All types</option>
                    {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading…</div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {["Name", "Email", "Postcode", "Country", "Type", "Consent", "Source", "Joined"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No signups yet.</td></tr>
                            ) : filtered.map((e) => (
                                <tr key={e.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{e.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{e.email}</td>
                                    <td className="px-4 py-3 text-gray-500">{e.postcode}</td>
                                    <td className="px-4 py-3 text-gray-500">{e.country}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${B2B.has(e.buyerType) ? "bg-[#C9573F]/10 text-[#C9573F]" : "bg-gray-100 text-gray-600"}`}>
                                            {TYPE_LABEL[e.buyerType] ?? e.buyerType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {e.consent
                                            ? <span className="text-green-600 text-xs font-medium">Opted in</span>
                                            : <span className="text-gray-400 text-xs">No</span>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{e.utm || "direct"}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(e.createdAt), "dd MMM yyyy")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${accent ?? "text-gray-900"}`}>{value}</p>
        </div>
    );
}
