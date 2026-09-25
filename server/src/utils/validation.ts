// Keep JSON booleans, arrays and blank strings out of numeric business fields.
export const parseFiniteNumber = (value: unknown): number | null => {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const parsePositiveInteger = (value: unknown, max = 2147483647): number | null => {
  const number = parseFiniteNumber(value);
  return number !== null && Number.isSafeInteger(number) && number >= 1 && number <= max ? number : null;
};

export const parseNonNegativeInteger = (value: unknown, max = 2147483647): number | null => {
  const number = parseFiniteNumber(value);
  return number !== null && Number.isSafeInteger(number) && number >= 0 && number <= max ? number : null;
};

export const parseDate = (value: unknown): Date | null => {
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) return null;
  if (typeof value === "string" && !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const parsePagination = (
  pageValue: unknown,
  limitValue: unknown,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {},
): { page: number; limit: number; skip: number } | null => {
  const page = parsePositiveInteger(pageValue ?? defaults.page ?? 1, 1_000_000);
  const limit = parsePositiveInteger(limitValue ?? defaults.limit ?? 20, defaults.maxLimit ?? 100);
  if (page === null || limit === null) return null;
  return { page, limit, skip: (page - 1) * limit };
};

export class InputError extends Error {
  readonly statusCode = 400;
}