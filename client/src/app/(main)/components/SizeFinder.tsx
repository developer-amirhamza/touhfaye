"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { addToCart } from "@/redux/slices/cartSlice";
import {
  SIZES,
  findSize,
  cmToIn,
  inToCm,
  RANGE_MIN_CM,
  RANGE_MAX_CM,
} from "@/config/sizes";

// Reusable size finder. Used both as the product "Size guide" tab (pass the
// product so the result can add to cart) and as the standalone /size-guide page.
// It's a pure calculator — no login, nothing stored.
interface Props {
  product?: { id: string } | null;
  chatHref?: string;
}

const TEAL = "#4F5B3A";

const SizeFinder: React.FC<Props> = ({ product, chatHref = "/contact-us" }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  // Internal value is always stored in cm; the UI converts for display.
  const [cm, setCm] = useState<number>(98);
  const [adding, setAdding] = useState(false);

  const result = useMemo(() => findSize(cm), [cm]);

  // Displayed value in the active unit.
  const displayValue = unit === "cm" ? Math.round(cm) : Math.round(cmToIn(cm));
  const setFromDisplay = (v: number) => setCm(unit === "cm" ? v : inToCm(v));

  const sliderMin = unit === "cm" ? RANGE_MIN_CM - 5 : Math.round(cmToIn(RANGE_MIN_CM - 5));
  const sliderMax = unit === "cm" ? RANGE_MAX_CM + 5 : Math.round(cmToIn(RANGE_MAX_CM + 5));

  const handleAdd = async () => {
    if (!product?.id || result.kind !== "size") return;
    setAdding(true);
    try {
      const action = await dispatch(addToCart({ productId: product.id, quantity: 1 }));
      if (addToCart.fulfilled.match(action)) toast.success(`Added (${result.size.label}) to cart`);
      else toast.error((action.payload as string) || "Couldn't add to cart");
    } finally {
      setAdding(false);
    }
  };

  // Screen-reader announcement text for the current result.
  const announcement =
    result.kind === "size"
      ? `Your size is ${result.size.label}. ${result.size.reassurance}`
      : result.kind === "unstocked"
      ? `${result.size.label} isn't stocked yet. Please chat to us.`
      : "That measurement is just outside our current range. Please chat to us.";

  return (
    <div className="max-w-4xl mx-auto ">
      <h2 className="text-3xl font-bold text-gray-900">Find your perfect fit</h2>
      <p className="text-gray-500 mt-1 mb-6 text-base">
        Takes about 10 seconds — for you, or someone you care for.
      </p>

      {/* ── 1. Fit Finder ── */}
      <section
        className="rounded-2xl border-2 border-[#4F5B3A]/25 bg-[#e6f0ee] p-6 md:p-7"
        aria-labelledby="fitfinder-heading"
      >
        <div className="flex items-center gap-2 mb-5">
          <Step n={1} />
          <h3 id="fitfinder-heading" className="text-xl font-bold text-gray-900">Fit Finder</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Input */}
          <div>
            <label htmlFor="waist-input" className="block text-base font-semibold text-gray-800 mb-3">
              Your waist measurement
            </label>

            <input
              id="waist-slider"
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={1}
              value={displayValue}
              onChange={(e) => setFromDisplay(Number(e.target.value))}
              aria-label={`Waist measurement in ${unit === "cm" ? "centimetres" : "inches"}`}
              className="w-full accent-[#4F5B3A] h-2 cursor-pointer"
            />

            <div className="flex items-center gap-3 mt-4">
              <input
                id="waist-input"
                type="number"
                inputMode="numeric"
                value={displayValue}
                onChange={(e) => setFromDisplay(Number(e.target.value))}
                className="w-24 text-3xl font-bold text-gray-900 bg-white rounded-lg px-3 py-2 border border-gray-300 outline-none focus:border-[#4F5B3A]"
              />
              <span className="text-lg text-gray-500">{unit}</span>

              {/* cm / in toggle */}
              <div
                role="group"
                aria-label="Measurement unit"
                className="ml-auto flex bg-white rounded-full p-1 border border-gray-200"
              >
                {(["cm", "in"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    aria-pressed={unit === u}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      unit === u ? "bg-[#4F5B3A] text-white" : "text-gray-500"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            {/* aria-live announces the size whenever it changes */}
            <span className="sr-only" aria-live="polite" role="status">{announcement}</span>

            {result.kind === "size" ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Your size</p>
                    <p className="text-4xl font-extrabold text-[#b4472b] leading-tight mt-0.5">
                      {result.size.label}
                    </p>
                  </div>
                  <span
                    className="w-7 h-7 rounded-full bg-[#4F5B3A] text-white flex items-center justify-center text-sm shrink-0"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {result.onBoundary ? "We’ve picked the comfier fit." : result.size.reassurance}
                </p>
                {product ? (
                  <button
                    onClick={handleAdd}
                    disabled={adding}
                    className="w-full mt-4 bg-[#e0a53a] hover:bg-[#cf9530] text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {adding ? "Adding…" : `Add ${result.size.label} to cart`}
                  </button>
                ) : (
                  <Link
                    href="/products"
                    className="block text-center w-full mt-4 bg-[#e0a53a] hover:bg-[#cf9530] text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    Shop {result.size.label}
                  </Link>
                )}
                <p className="text-xs text-gray-400 mt-2">Between sizes? We pick the comfier one.</p>
              </>
            ) : (
              <div className="py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Your size</p>
                <p className="text-xl font-bold text-gray-800 mt-1">
                  You’re just outside our current range
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {result.kind === "unstocked"
                    ? `${result.size.label} isn’t stocked yet — we’d love to help.`
                    : "Let’s find the right fit together — no dead ends here."}
                </p>
                <Link
                  href={chatHref}
                  className="block text-center w-full mt-4 bg-[#4F5B3A] hover:bg-[#27675b] text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Chat to us
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. How to measure ── */}
      <section className="mt-10" aria-labelledby="measure-heading">
        <div className="flex items-center gap-2 mb-5">
          <Step n={2} />
          <h3 id="measure-heading" className="text-xl font-bold text-gray-900">How to measure (it’s easy)</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Illustration */}
          <div className="bg-[#f7ede6] rounded-2xl p-6 flex flex-col items-center">
            <svg viewBox="0 0 200 240" className="w-44 h-56" role="img" aria-label="Body outline showing to measure around the widest part of the tummy and hips">
              <g fill="none" stroke="#b4472b" strokeWidth="4" strokeLinejoin="round">
                <circle cx="100" cy="42" r="26" fill="#f3d9cf" />
                <path d="M62 96 Q100 70 138 96 L150 150 Q100 210 50 150 Z" fill="#f3d9cf" />
              </g>
              <ellipse cx="100" cy="168" rx="58" ry="14" fill="none" stroke={TEAL} strokeWidth="4" strokeDasharray="7 6" />
              <rect x="44" y="184" width="112" height="26" rx="13" fill={TEAL} />
              <text x="100" y="201" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">measure around here</text>
            </svg>
            <p className="text-sm text-gray-500 mt-2">widest part of tummy / hips</p>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-4">
            <MeasureStep n={1} title="Grab a soft tape measure" body="— or a piece of string and a ruler." />
            <MeasureStep n={2} title="Wrap it around the widest part" body="of your tummy / hips, standing relaxed." />
            <MeasureStep n={3} title="Pop the number into the Fit Finder" body="above — it gives you your size instantly." />

            <div className="border border-[#e0a53a] rounded-xl bg-[#fdf6ec] p-4">
              <p className="font-bold text-[#a06a1f] text-sm">No tape measure?</p>
              <p className="text-sm text-gray-700 mt-1">
                Use a string, mark the overlap, measure it on a ruler — or use the waistband of trousers that fit you well.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Size chart ── */}
      <section className="mt-10" aria-labelledby="chart-heading">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Step n={3} />
            <h3 id="chart-heading" className="text-xl font-bold text-gray-900">Size chart</h3>
          </div>
          <span className="text-sm text-gray-400">example ranges — confirm with product spec</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left">
            <caption className="sr-only">Size chart by waist measurement in centimetres and inches</caption>
            <thead className="bg-[#4F5B3A] text-white text-sm">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Size</th>
                <th scope="col" className="px-4 py-3 font-semibold">Waist (cm)</th>
                <th scope="col" className="px-4 py-3 font-semibold">Waist (in)</th>
                <th scope="col" className="px-4 py-3 font-semibold">Good for</th>
              </tr>
            </thead>
            <tbody>
              {SIZES.map((s, i) => {
                const active = result.kind === "size" && result.size.short === s.short;
                return (
                  <tr key={s.short} className={i % 2 ? "bg-[#faf3ee]" : "bg-white"} aria-current={active ? "true" : undefined}>
                    <th scope="row" className="px-4 py-3 font-bold text-[#b4472b]">
                      {s.short}{active && <span className="ml-1 text-[#4F5B3A]" aria-label="your size">✓</span>}
                    </th>
                    <td className="px-4 py-3 text-gray-700">{s.minCm} – {s.maxCm}</td>
                    <td className="px-4 py-3 text-gray-700">{s.inches}</td>
                    <td className="px-4 py-3 text-gray-700">{s.goodFor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Closing reassurance */}
      <Link
        href={chatHref}
        className="mt-8 flex items-center gap-3 rounded-2xl border-2 border-[#4F5B3A]/25 bg-[#e6f0ee] px-5 py-4 hover:bg-[#dcebe8] transition-colors"
      >
        <span className="w-8 h-8 rounded-full bg-[#4F5B3A] text-white flex items-center justify-center shrink-0" aria-hidden="true">?</span>
        <span className="font-bold text-gray-800">Still unsure? Chat to us — we’ll help you get the fit right.</span>
      </Link>
    </div>
  );
};

function Step({ n }: { n: number }) {
  return (
    <span className="w-7 h-7 rounded-full bg-[#4F5B3A] text-white flex items-center justify-center text-sm font-bold shrink-0" aria-hidden="true">
      {n}
    </span>
  );
}

function MeasureStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-8 h-8 rounded-full bg-[#4F5B3A] text-white flex items-center justify-center text-sm font-bold shrink-0" aria-hidden="true">{n}</span>
      <p className="text-gray-700 text-base">
        <span className="font-bold text-gray-900">{title}</span> {body}
      </p>
    </div>
  );
}

export default SizeFinder;
