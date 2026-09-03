"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { SummeryApi } from "@/app/common/SummeryApi";
import { ROLES, TRADE_FAMILY } from "@/utils/roles";
import BookMeetingModal from "@/app/(main)/components/BookMeetingModal";

const COPY: Record<string, { eyebrow: string; heading: string; intro: string }> = {
  [ROLES.RETAILER]: {
    eyebrow: "Retailer account",
    heading: "Apply for a retailer account",
    intro: "Tell us about your pharmacy or store. Once approved, you'll see trade pricing, rebate tiers and POS assets.",
  },
  [ROLES.DISTRIBUTOR]: {
    eyebrow: "Distributor account",
    heading: "Apply for a distributor account",
    intro: "Tell us about your business. Once approved, you'll see committed-volume pricing, purchase-order tracking and our full certification library.",
  },
  [ROLES.TRADE]: {
    eyebrow: "Trade account",
    heading: "Apply for a trade account",
    intro: "Tell us about your business. Once approved, you'll see wholesale pricing and bulk ordering.",
  },
  [ROLES.NDIS_COORDINATOR]: {
    eyebrow: "NDIS coordinators",
    heading: "Get set up to quote",
    intro: "Register as a support coordinator or plan manager to build NDIS quotes on behalf of participants.",
  },
};

// Shared application form for the wholesale (Trade/Retailer/Distributor) and NDIS upgrade paths.
export default function ApplyForm({
  requestedRole,
}: {
  requestedRole: typeof ROLES.TRADE | typeof ROLES.RETAILER | typeof ROLES.DISTRIBUTOR | typeof ROLES.NDIS_COORDINATOR;
}) {
  const router = useRouter();
  const isTrade = TRADE_FAMILY.includes(requestedRole);
  const copy = COPY[requestedRole] ?? COPY[ROLES.TRADE];
  const [loading, setLoading] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    abn: "",
    businessType: "",
    organisation: "",
    contactName: "",
    contactPhone: "",
    notes: "",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await Axios({
        ...SummeryApi.applyForAccount,
        data: { requestedRole, ...form },
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Application submitted");
        router.push("/portal/consumer");
      }
    } catch (err) {
      AxiosToastError(err);
    } finally {
      setLoading(false);
    }
  };

  const input =
    "w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#1a56db] text-sm";

  return (
    <section className="bg-[#f5f0eb] min-h-screen py-14">
      <div className="container mx-auto px-6 max-w-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">{copy.eyebrow}</p>
        <h1 className="font-serif text-4xl text-gray-900 mt-1 mb-2">{copy.heading}</h1>
        <p className="text-gray-500 text-sm mb-8">{copy.intro}</p>

        <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 p-7 flex flex-col gap-4">
          {isTrade ? (
            <>
              <Field label="Business name">
                <input name="businessName" value={form.businessName} onChange={onChange} className={input} required />
              </Field>
              <Field label="ABN">
                <input name="abn" value={form.abn} onChange={onChange} className={input} required />
              </Field>
              <Field label="Business type">
                <input name="businessType" value={form.businessType} onChange={onChange} placeholder="Pharmacy, aged care, distributor…" className={input} />
              </Field>
            </>
          ) : (
            <Field label="Organisation">
              <input name="organisation" value={form.organisation} onChange={onChange} className={input} required />
            </Field>
          )}

          <Field label="Contact name">
            <input name="contactName" value={form.contactName} onChange={onChange} className={input} />
          </Field>
          <Field label="Contact phone">
            <input name="contactPhone" value={form.contactPhone} onChange={onChange} className={input} />
          </Field>
          <Field label="What do you need?">
            <textarea name="notes" value={form.notes} onChange={onChange} rows={3} className={input} />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[#1a1a18] hover:bg-[#33312c] text-white font-semibold text-sm px-6 py-3 rounded-full transition-colors disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit application"}
          </button>
          <p className="text-xs text-gray-400 text-center">
            You'll need to be signed in. We'll email you once your account is approved.
          </p>
        </form>

        {isTrade && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Prefer to talk it through first?{" "}
              <button
                type="button"
                onClick={() => setShowMeetingModal(true)}
                className="font-semibold text-[#1a1a18] underline underline-offset-2"
              >
                Book a meeting
              </button>{" "}
              and we'll call you — no account needed.
            </p>
          </div>
        )}
      </div>

      {showMeetingModal && <BookMeetingModal onClose={() => setShowMeetingModal(false)} />}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}