"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";

// ── Brand palette (per launch design rules) ──
const CORAL = "#0e4127";
const TEAL = "#2E7D71";
const CREAM = "#FFF7F1";

const STORAGE_KEY = "bestiee_waitlist_done"; // signed up OR dismissed
const AUTO_OPEN_MS = 7000; // gentle delay before first auto-open

const BUYER_TYPES = [
    { value: "USER", label: "User / for myself" },
    { value: "CARER", label: "Carer / family member" },
    { value: "PHARMACY", label: "Pharmacy" },
    { value: "AGED_CARE", label: "Aged care provider" },
    { value: "NDIS_PROVIDER", label: "NDIS provider / coordinator" },
    { value: "DISTRIBUTOR", label: "Overseas distributor" },
];

const COUNTRIES = ["Australia", "New Zealand", "United Kingdom", "United States", "Canada", "Other"];

interface FormState {
    name: string;
    email: string;
    postcode: string;
    country: string;
    buyerType: string;
    consent: boolean;
}

const initialForm: FormState = {
    name: "",
    email: "",
    postcode: "",
    country: "Australia",
    buyerType: "",
    consent: false,
};

export default function WaitlistPopup() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<FormState>(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [isB2B, setIsB2B] = useState(false);
    const [utm, setUtm] = useState<string | undefined>();

    // Decide when to show: always open on ?waitlist=1 (cold-email links),
    // otherwise auto-open once per browser after a short delay.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        // Capture attribution for the lead record.
        const utmParts = ["utm_source", "utm_medium", "utm_campaign"]
            .map((k) => params.get(k))
            .filter(Boolean);
        if (utmParts.length) setUtm(utmParts.join(" / "));

        const forced = params.get("waitlist") === "1";
        let alreadyDone = false;
        try {
            alreadyDone = localStorage.getItem(STORAGE_KEY) === "1";
        } catch {
            /* ignore */
        }

        if (forced) {
            setOpen(true);
            return;
        }
        if (alreadyDone) return;

        const t = setTimeout(() => setOpen(true), AUTO_OPEN_MS);
        return () => clearTimeout(t);
    }, []);

    const markDone = () => {
        try {
            localStorage.setItem(STORAGE_KEY, "1");
        } catch {
            /* ignore */
        }
    };

    const close = () => {
        setOpen(false);
        // Dismissing counts as "done" so we don't nag on every page — the
        // floating tab still lets them reopen it.
        if (!done) markDone();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!form.name.trim() || !form.email.trim() || !form.postcode.trim() || !form.buyerType) {
            setError("Please fill your name, email, postcode and select who you are.");
            return;
        }
        try {
            setSubmitting(true);
            const res = await Axios({
                ...SummeryApi.joinWaitlist,
                data: { ...form, utm },
            });
            if (res.data?.success) {
                setIsB2B(Boolean(res.data.data?.b2b));
                setDone(true);
                markDone();
            } else {
                setError(res.data?.message || "Something went wrong. Please try again.");
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Floating re-open tab (shown whenever the popup is closed).
    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                aria-label="Join the waitlist"
                className="fixed bottom-20 right-5 cursor-pointer bg-secondary-hover hover:bg-secondary duration-300  z-40 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"

            >
                ✨ Join the waitlist
            </button>
        );
    }

    const inputCls =
        "w-full rounded-lg border border-gray-300 text-text px-3 py-2.5 text-[16px] outline-none focus:border-[#2E7D71] focus:ring-1 focus:ring-[#2E7D71]";

    return (
        <div
            className="fixed inset-0 z-80 flex items-center justify-center p-0 md:p-4 "
            style={{ backgroundColor: "rgba(58,46,40,0.55)" }}
            onClick={close}
        >
            <div
                className="relative w-full md:max-w-md rounded-none md:rounded-2xl min-h-full overflow-y-scroll no-scrollbar flex flex-col h-full shadow-2xl my-0 md:my-4"
                style={{ backgroundColor: CREAM }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={close}
                    aria-label="Close"
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary cursor-pointer text-gray-500 hover:bg-white"
                >
                    ✕
                </button>

                {done ? (
                    // ── Thank-you state (Visual 3) ──
                    <div className="p-8 text-center">
                        <div
                            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white"
                            style={{ backgroundColor: TEAL }}
                        >
                            ✓
                        </div>
                        {isB2B ? (
                            <>
                                <h2 className="text-2xl font-bold" style={{ color: CORAL }}>
                                    Thanks — you're on the list.
                                </h2>
                                <p className="mt-2 text-gray-700">
                                    Our team will be in touch within <b>2 business days</b> to talk about
                                    supply, pricing and how Bestiee can work for your organisation.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold" style={{ color: CORAL }}>
                                    You're in! 🎉
                                </h2>
                                <p className="mt-2 text-gray-700">
                                    We'll email you the moment we launch. Know someone who'd love Bestiee?
                                    Share the freedom.
                                </p>
                            </>
                        )}
                        <button
                            onClick={() => setOpen(false)}
                            className="mt-6 rounded-full px-6 py-2.5 text-sm cursor-pointer font-semibold text-white"
                            style={{ backgroundColor: TEAL }}
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <div className="p-5  ">
                        {/* Hero — emotion first */}
                        <div
                            className="rounded-xl px-6 py-6 text-center text-white"
                            style={{ backgroundColor: CORAL }}
                        >
                            <h2 className="text-2xl font-bold">Freedom is coming.</h2>
                            <p className="mt-2 text-sm text-white/90">
                                Premium incontinence wear that feels like everyday underwear. Launching soon.
                            </p>
                            <p className="mt-3 text-xs italic text-white/80">Dignity · Comfort · Freedom</p>
                        </div>

                        {/* Form — 5 core fields */}
                        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-800">Full name *</label>
                                <input
                                    className={inputCls}
                                    placeholder="e.g. Margaret Chen"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-800">Email *</label>
                                <input
                                    type="email"
                                    className={inputCls}
                                    placeholder="you@email.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-gray-800">Postcode *</label>
                                    <input
                                        className={inputCls}
                                        placeholder="2113"
                                        value={form.postcode}
                                        onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-gray-800">Country *</label>
                                    <select
                                        className={inputCls}
                                        value={form.country}
                                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                                    >
                                        {COUNTRIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-800">I am a... *</label>
                                <select
                                    className={inputCls}
                                    value={form.buyerType}
                                    onChange={(e) => setForm({ ...form, buyerType: e.target.value })}
                                >
                                    <option value="">Select one</option>
                                    {BUYER_TYPES.map((b) => (
                                        <option key={b.value} value={b.value}>{b.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Consent — unticked by default */}
                            <label className="flex items-start gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    checked={form.consent}
                                    onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                                    className="mt-1 h-4 w-4 accent-[#2E7D71]"
                                    style={{ accentColor: TEAL }}
                                />
                                <span className="text-xs text-gray-600">
                                    I'd like launch news and helpful guides from Bestiee. Unsubscribe anytime.{" "}
                                    <Link href="/privacy-policy" className="underline" style={{ color: TEAL }}>
                                        Privacy Policy →
                                    </Link>
                                </span>
                            </label>

                            {error && <p className="text-sm text-red-600">{error}</p>}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-full py-3 cursor-pointer text-base font-semibold text-white transition-opacity disabled:opacity-60"
                                style={{ backgroundColor: CORAL }}
                            >
                                {submitting ? "Joining…" : "Join the waitlist"}
                            </button>
                            <p className="text-center text-xs text-gray-500">
                                🔒 Your details stay private. No spam, ever.
                            </p>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
