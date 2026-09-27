"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.normaliseRole = exports.TRADE_FAMILY = exports.ROLES = void 0;
const prisma_1 = require("../lib/prisma");
// Canonical role values used across the platform.
// OWNER is the site owner: full admin access, but the account itself is
// untouchable — no one (including other admins) can change its role/status
// or delete it, and OWNER can never be granted through the API.
exports.ROLES = {
    CONSUMER: "CONSUMER",
    // Legacy generic wholesale role — existing accounts keep working exactly
    // as before. New business signups now pick RETAILER or DISTRIBUTOR
    // instead, but all three share the same wholesale catalogue/order/pricing
    // mechanics (see TRADE_FAMILY).
    TRADE: "TRADE",
    RETAILER: "RETAILER",
    DISTRIBUTOR: "DISTRIBUTOR",
    NDIS_COORDINATOR: "NDIS_COORDINATOR",
    ADMIN: "ADMIN",
    OWNER: "OWNER",
};
// Every role that gets the wholesale catalogue, order history, standing
// orders and delivery-site routes.
exports.TRADE_FAMILY = [exports.ROLES.TRADE, exports.ROLES.RETAILER, exports.ROLES.DISTRIBUTOR];
// Normalise legacy values: "USER" was the old consumer role.
const normaliseRole = (role) => role === "USER" || !role ? exports.ROLES.CONSUMER : role;
exports.normaliseRole = normaliseRole;
// Must be used AFTER `auth`, which sets req.userId.
// Allows the request through only if the user's role is in `allowed`.
const requireRole = (...allowed) => async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res
                .status(401)
                .json({ success: false, error: true, message: "Authentication required" });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        const role = (0, exports.normaliseRole)(user?.role);
        // OWNER has every permission ADMIN has (and passes any role gate that
        // admits ADMIN), on top of any gate that names OWNER explicitly.
        const permitted = allowed.includes(role) || (role === exports.ROLES.OWNER && allowed.includes(exports.ROLES.ADMIN));
        if (!user || !permitted) {
            return res.status(403).json({
                success: false,
                error: true,
                message: "Access denied. Insufficient privileges.",
            });
        }
        req.userRole = role;
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: error.message || "Internal server error!",
        });
    }
};
exports.requireRole = requireRole;
