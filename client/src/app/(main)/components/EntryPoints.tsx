"use client";
import Link from "next/link";
import { useState } from "react";
import BookMeetingModal from "@/app/(main)/components/BookMeetingModal";

// The three public entry points from the brief's diagram:
// Shop (consumer) · Apply for a trade account (B2B) · NDIS — get a quote.
const ENTRIES = [
  {
    eyebrow: "Individuals & families",
    title: "Buy for yourself or someone you care for",
    checks: [
      "Plain, unmarked packaging every time",
      "Free delivery over $99, Australia wide",
      "Reorder in two clicks",
      "Not sure what to buy? Answer 4 questions",
    ],
    href: "/products",
    cta: "Start shopping",
    highlight: false,
  },
  {
    eyebrow: "Pharmacies & aged care",
    title: "Trade accounts, built for resellers",
    checks: [
      "Wholesale pricing with volume discounts",
      "Quick turnaround, same day dispatch",
      "Support 24/7, business to business",
      "A long term supply partner, not a one off",
      "Easy to use business portal",
    ],
    href: "/apply/trade",
    cta: "Open a trade account",
    secondaryCta: "Book a meeting",
    highlight: true,
  },
  {
    eyebrow: "Plan managers & coordinators",
    title: "NDIS and Support at Home, handled",
    checks: [
      "Exclusive quotes calculator, itemised",
      "Annual discounts on standing orders",
      "A simple guide to using the funding platform",
      "We invoice the plan directly",
    ],
    href: "/apply/ndis",
    cta: "Get a quote",
    highlight: false,
  },
];

export default function EntryPoints() {
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-12 gap-3">
          <span className="bg-primary text-secondary font-semibold rounded-full px-4.5 py-2 text-sm">
            Three ways to buy
          </span>
          <h2 className="font-secondary text-4xl md:text-5xl text-text-hover tracking-tight">
            How would you like to shop?
          </h2>
          <p className="text-base md:text-lg text-text max-w-xl">
            Pick the one that sounds like you. Each path is built for how you actually buy.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {ENTRIES.map((e) => (
            <div
              key={e.title}
              className={`flex flex-col rounded-2xl p-7 md:p-8 ${
                e.highlight
                  ? "bg-secondary text-background"
                  : "bg-white border border-primary-hover text-text-hover"
              }`}
            >
              <span
                className={`self-start rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                  e.highlight ? "bg-white/18 text-background" : "bg-primary text-secondary"
                }`}
              >
                {e.eyebrow}
              </span>
              <h3 className="font-secondary text-2xl md:text-[28px] leading-tight mt-4 mb-3.5">
                {e.title}
              </h3>
              <ul className="flex flex-col gap-2 flex-1">
                {e.checks.map((check) => (
                  <li
                    key={check}
                    className={`flex gap-2.5 text-[15px] leading-snug ${
                      e.highlight ? "text-background/90" : "text-text"
                    }`}
                  >
                    <span className={`font-bold shrink-0 ${e.highlight ? "" : "text-secondary"}`}>✓</span>
                    {check}
                  </li>
                ))}
              </ul>
              <Link
                href={e.href}
                className={`mt-6 text-center rounded-full py-3 font-semibold transition-colors ${
                  e.highlight
                    ? "bg-white text-secondary hover:bg-primary"
                    : "bg-secondary text-background hover:bg-secondary-hover"
                }`}
              >
                {e.cta} →
              </Link>
              {e.secondaryCta && (
                <button
                  type="button"
                  onClick={() => setShowMeetingModal(true)}
                  className={`mt-2.5 text-center rounded-full py-3 font-semibold transition-colors border ${
                    e.highlight
                      ? "border-white/40 text-background hover:bg-white/10"
                      : "border-primary-hover text-text-hover hover:bg-primary"
                  }`}
                >
                  {e.secondaryCta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {showMeetingModal && <BookMeetingModal onClose={() => setShowMeetingModal(false)} />}
    </section>
  );
}
