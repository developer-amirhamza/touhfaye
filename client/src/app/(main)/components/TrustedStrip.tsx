"use client";
import AutoScrollSlider from "./AutoScrollSlider";

// Example usage of the auto-scroll slider: a right-to-left "trusted by" marquee.
// Swap the text items for real brand/partner logos when available.
const ITEMS = [
  "NDIS Registered",
  "TENA",
  "MoliCare",
  "Discreet Delivery",
  "Australia-Wide",
  "Continence Nurses",
  "Plain Packaging",
  "Aged Care Trusted",
];

export default function TrustedStrip() {
  return (
    <section className="bg-[#f5f0eb] border-y border-[#e5ddd5] py-6">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 mb-4">
        Trusted across Australia
      </p>
      <AutoScrollSlider speed={30} gap={40}>
        {ITEMS.map((label) => (
          <span
            key={label}
            className="font-serif text-2xl text-gray-400 whitespace-nowrap"
          >
            {label}
          </span>
        ))}
      </AutoScrollSlider>
    </section>
  );
}
