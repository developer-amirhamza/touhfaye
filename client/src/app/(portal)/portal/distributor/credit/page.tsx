"use client";
import { useEffect, useState } from "react";
import PortalGuard from "../../PortalGuard";
import { ROLES } from "@/utils/roles";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";

interface CreditStatus {
  creditApproved: boolean;
  creditLimit: number | null;
  outstandingBalance: number;
  outstandingOrderCount: number;
  availableCredit: number | null;
}

const money = (n: number) => `$${(n ?? 0).toFixed(2)}`;

function CreditInner() {
  const [status, setStatus] = useState<CreditStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Axios({ ...SummeryApi.getMyCreditStatus })
      .then((res) => res.data?.success && setStatus(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Distributor</p>
      <h1 className="font-serif text-4xl text-gray-900 mt-1 mb-6">Credit & balance</h1>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : !status?.creditApproved ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-gray-700">30-day invoice credit hasn't been approved on your account yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Contact hello@mybestiee.com.au if you'd like to apply for credit terms.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-xs text-gray-500">Credit limit</p>
            <p className="font-serif text-3xl text-gray-900 mt-1">
              {status.creditLimit != null ? money(status.creditLimit) : "—"}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-xs text-gray-500">Outstanding balance</p>
            <p className="font-serif text-3xl text-gray-900 mt-1">{money(status.outstandingBalance)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {status.outstandingOrderCount} invoiced order{status.outstandingOrderCount === 1 ? "" : "s"} on account
            </p>
          </div>
          <div className="bg-[#1a1a18] text-white rounded-2xl p-6 sm:col-span-2">
            <p className="text-xs text-gray-300">Available credit</p>
            <p className="font-serif text-3xl mt-1">
              {status.availableCredit != null ? money(status.availableCredit) : "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DistributorCreditPage() {
  return (
    <PortalGuard allow={[ROLES.DISTRIBUTOR, ROLES.ADMIN]}>
      <CreditInner />
    </PortalGuard>
  );
}
