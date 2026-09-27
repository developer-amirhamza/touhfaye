"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputError = exports.parsePagination = exports.parseDate = exports.parseNonNegativeInteger = exports.parsePositiveInteger = exports.parseFiniteNumber = void 0;
// Keep JSON booleans, arrays and blank strings out of numeric business fields.
const parseFiniteNumber = (value) => {
    if (typeof value !== "number" && (typeof value !== "string" || !value.trim()))
        return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};
exports.parseFiniteNumber = parseFiniteNumber;
const parsePositiveInteger = (value, max = 2147483647) => {
    const number = (0, exports.parseFiniteNumber)(value);
    return number !== null && Number.isSafeInteger(number) && number >= 1 && number <= max ? number : null;
};
exports.parsePositiveInteger = parsePositiveInteger;
const parseNonNegativeInteger = (value, max = 2147483647) => {
    const number = (0, exports.parseFiniteNumber)(value);
    return number !== null && Number.isSafeInteger(number) && number >= 0 && number <= max ? number : null;
};
exports.parseNonNegativeInteger = parseNonNegativeInteger;
const parseDate = (value) => {
    if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date))
        return null;
    if (typeof value === "string" && !value.trim())
        return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};
exports.parseDate = parseDate;
const parsePagination = (pageValue, limitValue, defaults = {}) => {
    const page = (0, exports.parsePositiveInteger)(pageValue ?? defaults.page ?? 1, 1000000);
    const limit = (0, exports.parsePositiveInteger)(limitValue ?? defaults.limit ?? 20, defaults.maxLimit ?? 100);
    if (page === null || limit === null)
        return null;
    return { page, limit, skip: (page - 1) * limit };
};
exports.parsePagination = parsePagination;
class InputError extends Error {
    constructor() {
        super(...arguments);
        this.statusCode = 400;
    }
}
exports.InputError = InputError;
