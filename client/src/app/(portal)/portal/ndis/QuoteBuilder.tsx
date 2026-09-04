"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { SummeryApi } from "@/app/common/SummeryApi";
import FundingSupportModal from "./FundingSupportModal";

interface ProductOption {
  id: string;
  title: string;
  sizes?: string[];
}
interface Line {
  productId: string;
  productName: string;
  size?: string;
  absorbency?: string;
  dailyPads: number;
  packQuantity?: number;
}
interface Totals {
  items: any[];
  subtotal: number;
  discount: number;
  delivery: number;
  gst: number;
  total: number;
}

// Supply periods must match the backend's SUPPLY_PERIOD_DAYS keys. Recurring
// periods earn the tiered Subscribe & Save discount shown in the hint.
const PERIODS = [
  { value: "One-off", hint: null },
  { value: "Monthly", hint: null },
  { value: "Every 2 Months", hint: "10% off" },
  { value: "Every 4 Months", hint: "15% off" },
  { value: "Every 6 Months", hint: "18% off" },
  { value: "Annual", hint: "20% off" },
];

// Standard continence-product absorbency levels (drops scale).
const ABSORBENCY_OPTIONS = [
  "1 Drop (Light)",
  "2 Drops",
  "3 Drops",
  "4 Drops",
  "5 Drops",
  "6 Drops (Super)",
  "7 Drops",
  "8 Drops (Maxi)",
  "9 Drops",
  "10 Drops (Ultra)",
];

// Fallback sizes when the selected product doesn't define its own.
const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const money = (n: number) => `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;

export default function QuoteBuilder() {
  const [step, setStep] = useState(0);
  const [products, setProducts] = useState<ProductOption[]>([]);

  // Quote state
  const [participantRef, setParticipantRef] = useState("");
  const [planManagerEmail, setPlanManagerEmail] = useState("");
  const [supplyPeriod, setSupplyPeriod] = useState("Monthly");
  const [lines, setLines] = useState<Line[]>([]);

  // Calculator + persistence
  const [totals, setTotals] = useState<Totals | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [savedQuote, setSavedQuote] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [fundingOpen, setFundingOpen] = useState(false);

  useEffect(() => {
    Axios({ ...SummeryApi.fetchProducts })
      .then((res) => {
        if (res.data?.success) {
          setProducts(
            (res.data.data || []).map((p: any) => ({ id: p.id, title: p.title, sizes: p.sizes }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const validLines = useMemo(
    () => lines.filter((l) => l.productId && l.dailyPads > 0),
    [lines]
  );

  // Live preview whenever lines/period change (and we're on review step).
  useEffect(() => {
    if (step !== 2 || validLines.length === 0) {
      setTotals(null);
      setPreviewError(null);
      return;
    }
    let cancelled = false;
    setPreviewing(true);
    setPreviewError(null);
    Axios({
      ...SummeryApi.previewQuote,
      data: {
        supplyPeriod,
        lines: validLines.map((l) => ({
          productId: l.productId,
          size: l.size,
          absorbency: l.absorbency,
          dailyPads: Number(l.dailyPads),
          packQuantity: l.packQuantity ? Number(l.packQuantity) : undefined,
        })),
      },
    })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success) {
          setTotals(res.data.data);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setTotals(null);

        setPreviewError(
          err?.response?.data?.message || "Couldn't calculate this quote — please try again."
        );
      })
      .finally(() => !cancelled && setPreviewing(false));
    return () => {
      cancelled = true;
    };
  }, [step, supplyPeriod, validLines]);

  const addLine = () =>
    setLines([...lines, { productId: "", productName: "", dailyPads: 1 }]);
  const updateLine = (i: number, patch: Partial<Line>) =>
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  const saveQuote = async () => {
    try {
      setBusy(true);
      const res = await Axios({
        ...SummeryApi.createQuote,
        data: {
          supplyPeriod,
          participantRef,
          planManagerEmail,
          lines: validLines.map((l) => ({
            productId: l.productId,
            size: l.size,
            absorbency: l.absorbency,
            dailyPads: Number(l.dailyPads),
            packQuantity: l.packQuantity ? Number(l.packQuantity) : undefined,
          })),
        },
      });
      if (res.data?.success) {
        setSavedQuote(res.data.data);
        toast.success("Quote saved");
      }
    } catch (e) {
      AxiosToastError(e);
    } finally {
      setBusy(false);
    }
  };

  
  const emailQuote = async () => {
    let quote = savedQuote;
    if (!quote) {
      await saveQuote();
      quote = savedQuote;
    }
    try {
      setBusy(true);
      const id = quote?.id ?? savedQuote?.id;
      if (!id) return;
      const res = await Axios({ ...SummeryApi.emailQuote, data: { id } });
      if (res.data?.success) toast.success("Quote emailed");
    } catch (e) {
      AxiosToastError(e);
    } finally {
      setBusy(false);
    }
  };

  const stepValid =
    step === 0
      ? true
      : step === 1
      ? validLines.length > 0
      : true;

  return (
    <div className="p-8 max-w-5xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        NDIS Coordinator
      </p>
      <h1 className="font-serif text-4xl text-gray-900 mt-1 mb-6">New quote</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {["Details", "Products & usage", "Review"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                i <= step ? "bg-secondary text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-sm ${i === step ? "text-gray-900 font-medium" : "text-gray-400"}`}>
              {label}
            </span>
            {i < 2 && <span className="w-8 h-px bg-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Details ── */}
        {step === 0 && (
          <motion.div
            key="s0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl border border-gray-100 p-7 grid gap-5 max-w-lg"
          >
            <Field label="Participant reference (optional)">
              <input
                value={participantRef}
                onChange={(e) => setParticipantRef(e.target.value)}
                className={inputCls}
                placeholder="e.g. NDIS-12345"
              />
            </Field>
            <Field label="Plan manager email (optional)">
              <input
                value={planManagerEmail}
                onChange={(e) => setPlanManagerEmail(e.target.value)}
                className={inputCls}
                placeholder="planmanager@example.com"
              />
            </Field>
            <Field label="Supply period">
              <div className="grid grid-cols-2 gap-2">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setSupplyPeriod(p.value)}
                    className={`py-2.5 px-2 rounded-lg text-sm font-medium border transition-colors ${
                      supplyPeriod === p.value
                        ? "bg-secondary text-white border-secondary"
                        : "bg-white text-gray-600 border-gray-300 hover:border-secondary"
                    }`}
                  >
                    {p.value}
                    {p.hint && (
                      <span
                        className={`block text-[11px] font-semibold ${
                          supplyPeriod === p.value ? "text-[#c9e8e2]" : "text-title"
                        }`}
                      >
                        {p.hint}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {(() => {
                const active = PERIODS.find((p) => p.value === supplyPeriod);
                if (!active?.hint) return null;
                return (
                  <p className="text-sm text-secondary font-medium mt-1">
                    {supplyPeriod === "Annual"
                      ? "Annual supply applies the 12-month discount automatically."
                      : `Recurring ${supplyPeriod.toLowerCase()} supply — ${active.hint} is applied automatically.`}
                  </p>
                );
              })()}
            </Field>
          </motion.div>
        )}

        {/* ── Step 2: Products & usage ── */}
        {step === 1 && (
          <motion.div
            key="s1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4"
          >
            {lines.length === 0 && (
              <p className="text-sm text-gray-400">Add the products this participant needs.</p>
            )}
            {lines.map((line, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 grid md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <Field label="Product">
                    <ProductPicker
                      products={products}
                      value={line.productId}
                      valueLabel={line.productName}
                      onSelect={(p) => updateLine(i, { productId: p.id, productName: p.title })}
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Size">
                    <select
                      value={line.size ?? ""}
                      onChange={(e) => updateLine(i, { size: e.target.value })}
                      className={inputCls}
                    >
                      <option value="">Select…</option>
                      {(() => {
                        const selected = products.find((p) => p.id === line.productId);
                        const sizes = selected?.sizes?.length ? selected.sizes : DEFAULT_SIZES;
                        return sizes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ));
                      })()}
                    </select>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Absorbency">
                    <select
                      value={line.absorbency ?? ""}
                      onChange={(e) => updateLine(i, { absorbency: e.target.value })}
                      className={inputCls}
                    >
                      <option value="">Select…</option>
                      {ABSORBENCY_OPTIONS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Pads / day">
                    <input
                      type="number"
                      min={0}
                      value={line.dailyPads}
                      onChange={(e) => updateLine(i, { dailyPads: Number(e.target.value) })}
                      className={inputCls}
                    />
                  </Field>
                </div>
                {supplyPeriod === "One-off" && (
                  <div className="md:col-span-1">
                    <Field label="Pack qty">
                      <input
                        type="number"
                        min={1}
                        value={line.packQuantity ?? 1}
                        onChange={(e) => updateLine(i, { packQuantity: Number(e.target.value) })}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                )}
                <div className="md:col-span-1">
                  <button
                    onClick={() => removeLine(i)}
                    className="text-red-500 text-xs hover:underline py-2.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addLine}
              className="self-start text-sm font-semibold text-[#2f7d6f] hover:underline"
            >
              + Add product
            </button>
          </motion.div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 2 && (
          <motion.div
            key="s2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Line items */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {previewError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {previewError}
                </div>
              )}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Product</th>
                    <th className="text-left px-4 py-3">Usage</th>
                    <th className="text-right px-4 py-3">Total pads</th>
                    <th className="text-right px-4 py-3">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {(totals?.items ?? []).map((it: any, i: number) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{it.productName}</div>
                        <div className="text-xs text-gray-400">
                          {[it.size, it.absorbency].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {it.dailyPads}/day × {it.days}d
                      </td>
                      <td className="px-4 py-3 text-right">{it.totalPads}</td>
                      <td className="px-4 py-3 text-right">{money(it.lineTotal)}</td>
                    </tr>
                  ))}
                  {(!totals || totals.items.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                        {previewing ? "Calculating…" : "No items to quote"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>

            {/* Totals + actions */}
            <div className="bg-[#1a1a18] text-white rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="font-serif text-xl mb-2">Quote summary</h3>
              <Row label="Subtotal" value={money(totals?.subtotal ?? 0)} />
              {(totals?.discount ?? 0) > 0 && (
                <Row
                  label={supplyPeriod === "Annual" ? "Annual discount" : "Recurring supply discount"}
                  value={`-${money(totals!.discount)}`}
                  accent
                />
              )}
              <Row label="Delivery" value={money(totals?.delivery ?? 0)} />
              <Row label="GST" value={money(totals?.gst ?? 0)} />
              <div className="border-t border-white/10 my-2" />
              <Row label="Total" value={money(totals?.total ?? 0)} big />

              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={saveQuote}
                  disabled={busy || !totals}
                  className="bg-[#c9b89a] text-[#1a1a18] font-semibold text-sm py-2.5 rounded-full hover:bg-[#b8a489] transition-colors disabled:opacity-50"
                >
                  {savedQuote ? "Saved ✓ Save again" : "Save quote"}
                </button>
                <button
                  onClick={emailQuote}
                  disabled={busy || !totals}
                  className="border border-white/30 text-white font-semibold text-sm py-2.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Email PDF quote
                </button>
                <button
                  onClick={() => setFundingOpen(true)}
                  className="text-[#c9b89a] text-sm py-2 hover:underline"
                >
                  Funding doesn’t cover this? Talk to us →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav buttons */}
      <div className="flex justify-between mt-8 max-w-5xl">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
        >
          Back
        </button>
        {step < 2 && (
          <button
            onClick={() => stepValid && setStep((s) => s + 1)}
            disabled={!stepValid}
            className="px-6 py-2.5 rounded-full text-sm font-semibold bg-secondary-hover cursor-pointer text-white hover:bg-secondary disabled:opacity-50"
          >
            Continue
          </button>
        )}
      </div>

      <FundingSupportModal
        open={fundingOpen}
        onClose={() => setFundingOpen(false)}
        quoteId={savedQuote?.id}
      />
    </div>
  );
}

const inputCls =
  "w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#2f7d6f] text-sm";

// Type-to-search product picker — filters the already-loaded product list
// by title as the coordinator types, instead of scrolling a long <select>.
function ProductPicker({
  products,
  value,
  valueLabel,
  onSelect,
}: {
  products: ProductOption[];
  value: string;
  valueLabel?: string;
  onSelect: (p: ProductOption) => void;
}) {
  const [query, setQuery] = useState(valueLabel ?? "");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 20);
    return products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 20);
  }, [products, query]);

  return (
    <div className="relative" ref={boxRef}>
      <input
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          setOpen(true);
          // Clearing the field fully invalidates the current pick; otherwise
          // keep the last confirmed selection until the user clicks a match.
          if (value && next.trim() === "") onSelect({ id: "", title: "" });
        }}
        onFocus={() => setOpen(true)}
        placeholder="Type to search products…"
        className={inputCls}
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {matches.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelect(p);
                setQuery(p.title);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                p.id === value ? "bg-[#2f7d6f]/10 text-[#2f7d6f] font-medium" : "text-gray-700"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && matches.length === 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
          No products match "{query}"
        </div>
      )}
    </div>
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

function Row({ label, value, big, accent }: { label: string; value: string; big?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`${big ? "text-base font-semibold" : "text-sm"} ${accent ? "text-[#c9b89a]" : "text-gray-300"}`}>
        {label}
      </span>
      <span className={`${big ? "text-2xl font-serif" : "text-sm"} ${accent ? "text-[#c9b89a]" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}
