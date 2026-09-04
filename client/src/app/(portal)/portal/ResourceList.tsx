"use client";
import { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";

interface Resource {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
}

// Shared downloadable-resource list for the Retailer (POS/shelf assets) and
// Distributor (certifications) portal pages — same shape, different category.
export default function ResourceList({
  category,
  eyebrow,
  title,
  emptyText,
}: {
  category: "CERTIFICATION" | "POS_ASSET";
  eyebrow: string;
  title: string;
  emptyText: string;
}) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Axios({ ...SummeryApi.getPortalResources, params: { category } })
      .then((res) => res.data?.success && setResources(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="p-8 max-w-3xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">{eyebrow}</p>
      <h1 className="font-serif text-4xl text-gray-900 mt-1 mb-6">{title}</h1>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : resources.length === 0 ? (
        <p className="text-gray-400">{emptyText}</p>
      ) : (
        <div className="grid gap-3">
          {resources.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-gray-800">{r.title}</p>
                {r.description && <p className="text-sm text-gray-500 mt-1">{r.description}</p>}
              </div>
              <a
                href={r.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 bg-[#1a1a18] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#33312c] transition-colors"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
