import { Response, Request } from "express";
import { errorHandler } from "../utils/errorHandler";
import { prisma } from "../lib/prisma";

interface AuthRequest extends Request {
  userId?: string;
}

// ── Multi-site delivery (trade) ─────────────────────────────────────────────
export const listDeliverySites = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);
    const sites = await prisma.deliverySite.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    return res.status(200).json({ success: true, error: false, data: sites });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

export const upsertDeliverySite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);
    const { id, label, address, phone, contact, isDefault } = req.body;

    // Only one default per account.
    if (isDefault) {
      await prisma.deliverySite.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    if (!id) {
      if (!label || !address) return errorHandler(res, 400, "label and address are required", true);
      const created = await prisma.deliverySite.create({
        data: { userId, label, address, phone: phone ?? null, contact: contact ?? null, isDefault: Boolean(isDefault) },
      });
      return res.status(200).json({ success: true, error: false, message: "Site added", data: created });
    }

    const data: any = {};
    if (label) data.label = label;
    if (address) data.address = address;
    if (phone !== undefined) data.phone = phone;
    if (contact !== undefined) data.contact = contact;
    if (isDefault !== undefined) data.isDefault = Boolean(isDefault);

    const updated = await prisma.deliverySite.update({ where: { id }, data });
    return res.status(200).json({ success: true, error: false, message: "Site updated", data: updated });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

export const deleteDeliverySite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return errorHandler(res, 400, "id is required", true);
    await prisma.deliverySite.delete({ where: { id } });
    return res.status(200).json({ success: true, error: false, message: "Site deleted" });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// ── Negotiated pricing (admin) ──────────────────────────────────────────────
export const listNegotiatedPrices = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) return errorHandler(res, 400, "userId is required", true);
    const prices = await prisma.negotiatedPrice.findMany({
      where: { userId: String(userId) },
    });
    return res.status(200).json({ success: true, error: false, data: prices });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

export const upsertNegotiatedPrice = async (req: Request, res: Response) => {
  try {
    const { userId, productId, price } = req.body;
    if (!userId || !productId || price == null) {
      return errorHandler(res, 400, "userId, productId and price are required", true);
    }
    const negotiated = await prisma.negotiatedPrice.upsert({
      where: { userId_productId: { userId, productId } },
      update: { price: Number(price) },
      create: { userId, productId, price: Number(price) },
    });
    return res.status(200).json({ success: true, error: false, message: "Negotiated price saved", data: negotiated });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

export const deleteNegotiatedPrice = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return errorHandler(res, 400, "id is required", true);
    await prisma.negotiatedPrice.delete({ where: { id } });
    return res.status(200).json({ success: true, error: false, message: "Negotiated price deleted" });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// ── Deeper reporting (admin) ────────────────────────────────────────────────
// Server-side aggregation: revenue by channel, top products, account activity,
// and a 6-month revenue trend. More authoritative than the client-side view.
export const getReport = async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({ include: { items: true } });

    const channelOf = (o: any) => {
      const n = (o.orderNumber || "").toUpperCase();
      if (n.startsWith("TRD")) return "Trade";
      if (n.startsWith("SUB")) return "Subscription";
      if (o.paymentMethod === "NDIS Quote") return "NDIS";
      return "Consumer";
    };

    const byChannel: Record<string, { count: number; revenue: number }> = {};
    const byProduct: Record<string, { name: string; qty: number; revenue: number }> = {};
    const byMonth: Record<string, number> = {};
    let totalRevenue = 0;

    for (const o of orders) {
      const ch = channelOf(o);
      byChannel[ch] ??= { count: 0, revenue: 0 };
      byChannel[ch].count += 1;
      byChannel[ch].revenue += o.total ?? 0;
      totalRevenue += o.total ?? 0;

      const month = new Date(o.createdAt).toISOString().slice(0, 7); // YYYY-MM
      byMonth[month] = (byMonth[month] ?? 0) + (o.total ?? 0);

      for (const it of o.items) {
        byProduct[it.productId] ??= { name: it.productName, qty: 0, revenue: 0 };
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
    const usersByRole = await prisma.user.groupBy({ by: ["role"], _count: { _all: true } });
    const pendingApplications = await prisma.accountApplication.count({ where: { status: "PENDING" } });
    const openEnquiries = await prisma.enquiry.count({ where: { status: { not: "RESOLVED" } } });

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
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};