"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReport = exports.deleteNegotiatedPrice = exports.upsertNegotiatedPrice = exports.listNegotiatedPrices = exports.deleteDeliverySite = exports.upsertDeliverySite = exports.listDeliverySites = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const prisma_1 = require("../lib/prisma");
// ── Multi-site delivery (trade) ─────────────────────────────────────────────
const listDeliverySites = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return (0, errorHandler_1.errorHandler)(res, 401, "Authentication required", true);
        const sites = await prisma_1.prisma.deliverySite.findMany({
            where: { userId },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        });
        return res.status(200).json({ success: true, error: false, data: sites });
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.listDeliverySites = listDeliverySites;
const upsertDeliverySite = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return (0, errorHandler_1.errorHandler)(res, 401, "Authentication required", true);
        const { id, label, address, phone, contact, isDefault } = req.body;
        // Only one default per account.
        if (isDefault) {
            await prisma_1.prisma.deliverySite.updateMany({ where: { userId }, data: { isDefault: false } });
        }
        if (!id) {
            if (!label || !address)
                return (0, errorHandler_1.errorHandler)(res, 400, "label and address are required", true);
            const created = await prisma_1.prisma.deliverySite.create({
                data: { userId, label, address, phone: phone ?? null, contact: contact ?? null, isDefault: Boolean(isDefault) },
            });
            return res.status(200).json({ success: true, error: false, message: "Site added", data: created });
        }
        const data = {};
        if (label)
            data.label = label;
        if (address)
            data.address = address;
        if (phone !== undefined)
            data.phone = phone;
        if (contact !== undefined)
            data.contact = contact;
        if (isDefault !== undefined)
            data.isDefault = Boolean(isDefault);
        const updated = await prisma_1.prisma.deliverySite.update({ where: { id }, data });
        return res.status(200).json({ success: true, error: false, message: "Site updated", data: updated });
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.upsertDeliverySite = upsertDeliverySite;
const deleteDeliverySite = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id)
            return (0, errorHandler_1.errorHandler)(res, 400, "id is required", true);
        await prisma_1.prisma.deliverySite.delete({ where: { id } });
        return res.status(200).json({ success: true, error: false, message: "Site deleted" });
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.deleteDeliverySite = deleteDeliverySite;
// ── Negotiated pricing (admin) ──────────────────────────────────────────────
const listNegotiatedPrices = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId)
            return (0, errorHandler_1.errorHandler)(res, 400, "userId is required", true);
        const prices = await prisma_1.prisma.negotiatedPrice.findMany({
            where: { userId: String(userId) },
        });
        return res.status(200).json({ success: true, error: false, data: prices });
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.listNegotiatedPrices = listNegotiatedPrices;
const upsertNegotiatedPrice = async (req, res) => {
    try {
        const { userId, productId, price } = req.body;
        if (!userId || !productId || price == null) {
            return (0, errorHandler_1.errorHandler)(res, 400, "userId, productId and price are required", true);
        }
        const negotiated = await prisma_1.prisma.negotiatedPrice.upsert({
            where: { userId_productId: { userId, productId } },
            update: { price: Number(price) },
            create: { userId, productId, price: Number(price) },
        });
        return res.status(200).json({ success: true, error: false, message: "Negotiated price saved", data: negotiated });
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.upsertNegotiatedPrice = upsertNegotiatedPrice;
const deleteNegotiatedPrice = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id)
            return (0, errorHandler_1.errorHandler)(res, 400, "id is required", true);
        await prisma_1.prisma.negotiatedPrice.delete({ where: { id } });
        return res.status(200).json({ success: true, error: false, message: "Negotiated price deleted" });
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.deleteNegotiatedPrice = deleteNegotiatedPrice;
// ── Deeper reporting (admin) ────────────────────────────────────────────────
// Server-side aggregation: revenue by channel, top products, account activity,
// and a 6-month revenue trend. More authoritative than the client-side view.
const getReport = async (_req, res) => {
    var _a;
    try {
        const orders = await prisma_1.prisma.order.findMany({ include: { items: true } });
        const channelOf = (o) => {
            const n = (o.orderNumber || "").toUpperCase();
            if (n.startsWith("TRD"))
                return "Trade";
            if (n.startsWith("SUB"))
                return "Subscription";
            if (o.paymentMethod === "NDIS Quote")
                return "NDIS";
            return "Consumer";
        };
        const byChannel = {};
        const byProduct = {};
        const byMonth = {};
        let totalRevenue = 0;
        for (const o of orders) {
            const ch = channelOf(o);
            byChannel[ch] ?? (byChannel[ch] = { count: 0, revenue: 0 });
            byChannel[ch].count += 1;
            byChannel[ch].revenue += o.total ?? 0;
            totalRevenue += o.total ?? 0;
            const month = new Date(o.createdAt).toISOString().slice(0, 7); // YYYY-MM
            byMonth[month] = (byMonth[month] ?? 0) + (o.total ?? 0);
            for (const it of o.items) {
                byProduct[_a = it.productId] ?? (byProduct[_a] = { name: it.productName, qty: 0, revenue: 0 });
                byProduct[it.productId].qty += it.quantity;
                byProduct[it.productId].revenue += it.total;
            }
        }
        const topProducts = Object.values(byProduct)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
        const trend = Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([month, revenue]) => ({ month, revenue: +revenue.toFixed(2) }));
        // Account activity by role.
        const usersByRole = await prisma_1.prisma.user.groupBy({ by: ["role"], _count: { _all: true } });
        const pendingApplications = await prisma_1.prisma.accountApplication.count({ where: { status: "PENDING" } });
        const openEnquiries = await prisma_1.prisma.enquiry.count({ where: { status: { not: "RESOLVED" } } });
        return res.status(200).json({
            success: true,
            error: false,
            data: {
                totalRevenue: +totalRevenue.toFixed(2),
                orderCount: orders.length,
                byChannel,
                topProducts,
                trend,
                accounts: usersByRole.map((u) => ({ role: u.role ?? "CONSUMER", count: u._count._all })),
                pendingApplications,
                openEnquiries,
            },
        });
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.getReport = getReport;
