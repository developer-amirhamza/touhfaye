"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const auth = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken || req?.headers?.authorization?.split(" ")[1];
        // Validate token type
        if (!token || typeof token !== 'string' || token.trim() === '') {
            return res.status(401).json({
                success: false,
                message: "Authentication token is missing or invalid"
            });
        }
        // Verify secret exists
        const secret = process.env.SECRET_KEY_ACCESS_TOKEN;
        // Verify token
        const decoded = await jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
        req.userId = decoded.id;
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message === 'jwt must be a string'
                ? 'Invalid token format'
                : 'Invalid or expired token'
        });
    }
};
exports.auth = auth;
// Optional auth: attaches req.userId when a valid token is present, but lets
// the request through as a GUEST when the token is missing/invalid/expired.
// Use on routes that must work for both signed-in users and guests (cart,
// checkout, place-order) — the controllers already handle a missing userId
// by falling back to the guest cart token / a supplied email.
const optionalAuth = async (req, _res, next) => {
    try {
        const token = req.cookies?.accessToken || req?.headers?.authorization?.split(" ")[1];
        if (token && typeof token === "string" && token.trim() !== "") {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
                req.userId = decoded.id;
            }
            catch {
                // Invalid / expired token → treat as a guest, don't block the request.
            }
        }
    }
    catch {
        // Never fail the request from optional auth.
    }
    next();
};
exports.optionalAuth = optionalAuth;
