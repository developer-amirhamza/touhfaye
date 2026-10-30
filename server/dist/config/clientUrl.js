"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.primaryClientUrl = exports.clientOrigins = void 0;
require("dotenv/config");
// CLIENT_URL can hold multiple comma-separated origins (e.g. the apex and www
// domains). Nothing splits that string automatically, so callers that need a
// single URL (redirect links, emails) must use primaryClientUrl, and CORS
// must check the request origin against the whole list.
const rawClientUrl = process.env.CLIENT_URL || "";
exports.clientOrigins = rawClientUrl
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
exports.primaryClientUrl = exports.clientOrigins[0] || "";
