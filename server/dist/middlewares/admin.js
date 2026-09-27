"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = void 0;
const prisma_1 = require("../lib/prisma");
// Must be used AFTER the `auth` middleware, which sets req.userId.
const admin = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: true,
                message: "Authentication required",
            });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        // OWNER is the site owner and has full admin access.
        if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
            return res.status(403).json({
                success: false,
                error: true,
                message: "Access denied. Admin privileges required.",
            });
        }
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
exports.admin = admin;
