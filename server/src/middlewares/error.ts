import type { ErrorRequestHandler, RequestHandler } from "express";
import { errorHandler } from "../utils/errorHandler";

type ErrorWithMetadata = Error & {
    body?: unknown;
    code?: unknown;
    status?: unknown;
    statusCode?: unknown;
};

const isStatusCode = (value: unknown): value is number =>
    typeof value === "number" && Number.isInteger(value) && value >= 400 && value <= 599;

export class AppError extends Error {
    readonly statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.name = "AppError";
        this.statusCode = isStatusCode(statusCode) ? statusCode : 500;
    }
}

const normaliseError = (error: unknown): { statusCode: number; message: string } => {
    if (error instanceof AppError) {
        return { statusCode: error.statusCode, message: error.message };
    }

    if (error instanceof SyntaxError && "body" in error) {
        return { statusCode: 400, message: "Request body contains invalid JSON" };
    }

    if (error instanceof Error) {
        const candidate = error as ErrorWithMetadata;

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

export const notFoundHandler: RequestHandler = (req, res) => {
    errorHandler(res, 404, `API route not found: ${req.method} ${req.path}`);
};

export const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    const normalised = normaliseError(error);
    if (normalised.statusCode >= 500) {
        console.error(`Unhandled API error: ${req.method} ${req.originalUrl}`, error);
    }

    errorHandler(res, normalised.statusCode, normalised.message);
};