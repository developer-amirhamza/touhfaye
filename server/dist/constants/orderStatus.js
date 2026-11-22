"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidOrderStatus = exports.ORDER_STATUSES = void 0;
// Mirrors client/src/app/common/orderStatus.ts — keep the value list in sync
// with that file (display labels/step order live there; this is just the
// server's validation list).
exports.ORDER_STATUSES = [
    "Pending",
    "Approved",
    "Preparing",
    "ReadyToShip",
    "WithCourier",
    "Delivered",
    "Cancelled",
];
const isValidOrderStatus = (value) => typeof value === "string" && exports.ORDER_STATUSES.includes(value);
exports.isValidOrderStatus = isValidOrderStatus;
