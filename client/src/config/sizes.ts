// Single source of truth for pull-up sizing. The Fit Finder and the size chart
// both read from this, so sizes can be updated without a code change.
// Breakpoints are clean and contiguous: each cm value maps to exactly one size
// (min inclusive, max exclusive) — no gaps, no overlaps.
//
// NOTE: these are example ranges from the mockup — replace min/max/inch/goodFor
// with the real values from the product spec sheet when supplied.

export interface SizeDef {
  label: string;        // "Medium"
  short: string;        // "M"
  minCm: number;        // inclusive
  maxCm: number;        // exclusive
  inches: string;       // display range, e.g. "33 – 43"
  goodFor: string;      // "Most common — everyday wear"
  reassurance: string;  // one-liner shown in the result card
  stocked: boolean;     // whether we currently sell this size
}

export const SIZES: SizeDef[] = [
  { label: "Small",  short: "S",  minCm: 60,  maxCm: 85,  inches: "24 – 33", goodFor: "Slimmer build, day use",        reassurance: "Snug, secure fit — no gaps.", stocked: true },
  { label: "Medium", short: "M",  minCm: 85,  maxCm: 110, inches: "33 – 43", goodFor: "Most common — everyday wear",   reassurance: "Snug, secure fit — no gaps.", stocked: true },
  { label: "Large",  short: "L",  minCm: 110, maxCm: 135, inches: "43 – 53", goodFor: "Fuller hips, day & night",      reassurance: "Comfortable coverage, stays in place.", stocked: true },
  { label: "XL",     short: "XL", minCm: 135, maxCm: 170, inches: "53 – 67", goodFor: "Maximum comfort & coverage",    reassurance: "Maximum comfort and coverage.", stocked: true },
];

// The overall range we cover (min of first, max of last).
export const RANGE_MIN_CM = SIZES[0].minCm;
export const RANGE_MAX_CM = SIZES[SIZES.length - 1].maxCm;

export type FitResult =
  | { kind: "size"; size: SizeDef; onBoundary: boolean }
  | { kind: "unstocked"; size: SizeDef }
  | { kind: "out-of-range" };

// Resolve a waist measurement (cm) to a single size.
// - On an exact boundary between two sizes → pick the LARGER for comfort.
// - Outside our covered range, or matched size not stocked → friendly fallback.
export const findSize = (cm: number): FitResult => {
  if (isNaN(cm) || cm < RANGE_MIN_CM || cm >= RANGE_MAX_CM) {
    return { kind: "out-of-range" };
  }

  // A value sits "on a boundary" when it equals a size's exclusive max
  // (i.e. the start of the next size). We already resolve to the larger size
  // via the min-inclusive/max-exclusive rule; flag it so we can say so.
  const onBoundary = SIZES.some((s) => cm === s.maxCm && cm < RANGE_MAX_CM);

  const match = SIZES.find((s) => cm >= s.minCm && cm < s.maxCm);
  if (!match) return { kind: "out-of-range" };
  if (!match.stocked) return { kind: "unstocked", size: match };

  return { kind: "size", size: match, onBoundary };
};

// Unit helpers.
export const cmToIn = (cm: number) => cm / 2.54;
export const inToCm = (inches: number) => inches * 2.54;