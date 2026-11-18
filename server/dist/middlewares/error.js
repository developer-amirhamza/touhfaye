"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = exports.notFoundHandler = exports.AppError = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const isStatusCode = (value) => typeof value === "number" && Number.isInteger(value) && value >= 400 && value <= 599;
class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.name = "AppError";
        this.statusCode = isStatusCode(statusCode) ? statusCode : 500;
    }
}
exports.AppError = AppError;
const normaliseError = (error) => {
    if (error instanceof AppError) {
        return { statusCode: error.statusCode, message: error.message };
    }
    if (error instanceof SyntaxError && "body" in error) {
        return { statusCode: 400, message: "Request body contains invalid JSON" };
    }
    if (error instanceof Error) {
        const candidate = error;
        if (candidate.code === "LIMIT_FILE_SIZE") {
            return { statusCode: 413, message: "The uploaded file is too large" };
        }
        if (typeof candidate.code === "string" && candidate.code.startsWith("LIMIT_")) {
            return { statusCode: 400, message: "The uploaded file is invalid" };
        }
        if (candidate.code === "P2002") {
            return { statusCode: 409, message: "A record with these details already exists" };
        }
        if (candidate.code === "P2025") {
            return { statusCode: 404, message: "The requested record was not found" };
        }
        const statusCode = isStatusCode(candidate.statusCode)
            ? candidate.statusCode
            : isStatusCode(candidate.status)
                ? candidate.status
                : 500;
        if (statusCode < 500) {
            return { statusCode, message: error.message || "Request failed" };
        }
    }
    return { statusCode: 500, message: "Internal server error" };
};
const notFoundHandler = (req, res) => {
    (0, errorHandler_1.errorHandler)(res, 404, `API route not found: ${req.method} ${req.path}`);
};
exports.notFoundHandler = notFoundHandler;
const globalErrorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }
    const normalised = normaliseError(error);
    if (normalised.statusCode >= 500) {
        console.error(`Unhandled API error: ${req.method} ${req.originalUrl}`, error);
    }
    (0, errorHandler_1.errorHandler)(res, normalised.statusCode, normalised.message);
};
exports.globalErrorHandler = globalErrorHandler;
