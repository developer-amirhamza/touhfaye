"use client";
import { useEffect, useState } from "react";
import PortalGuard from "../../PortalGuard";
import { ROLES } from "@/utils/roles";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";

interface Contact {
  name: string;
  email: string;
  phone: string;
  hours: string;
}

function AccountManagerInner() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Axios({ ...SummeryApi.getAccountManagerContact })
      .then((res) => res.data?.success && setContact(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Retailer</p>
      <h1 className="font-serif text-4xl text-gray-900 mt-1 mb-6">Your account manager</h1>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : !contact || !contact.name ? (
        <p className="text-gray-400">
          Your account manager's details haven't been set up yet — email hello@mybestiee.com.au and we'll connect you.
        </p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-3">
          <p className="font-medium text-gray-800 text-lg">{contact.name}</p>
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="text-[#1a56db] hover:underline text-sm">
              {contact.email}
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="text-[#1a56db] hover:underline text-sm">
              {contact.phone}
            </a>
          )}
          {contact.hours && <p className="text-sm text-gray-500">{contact.hours}</p>}
        </div>
      )}
    </div>
  );
}

export default function RetailerAccountManagerPage() {
  return (
    <PortalGuard allow={[ROLES.RETAILER, ROLES.ADMIN]}>
      <AccountManagerInner />
    </PortalGuard>
  );
}
