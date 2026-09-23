"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (res, statusCode, message, error = true, data = null) => {
    res.status(statusCode).json({
        success: !error,
        error,
        message,
        ...(data ? { data } : {})
    });
};
exports.errorHandler = errorHandler;
