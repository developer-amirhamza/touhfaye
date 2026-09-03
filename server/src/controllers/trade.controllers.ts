import { Response, Request } from "express";
import { errorHandler } from "../utils/errorHandler";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../config/sendEmail";
import { generateInvoicePdf } from "../utils/generateInvoicePdf";
import { ROLES } from "../middlewares/role";
import { resolveUnitPrice, buildTotals } from "../services/pricing";

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

interface OrderItemData {
  productName: string;
  productId: string;
  productImage: string | null;
  price: number;
  quantity: number;
  total: number;
}


interface LineInput {
  productId: string;
  quantity: number;
}

const generateTradeOrderNumber = async () => {
  const date = new Date();
  const prefix = `TRD-${date.getFullYear()}${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`;
  let counter = 1;
  let orderNumber = `${prefix}-${counter.toString().padStart(3, "0")}`;
  while (await prisma.order.findUnique({ where: { orderNumber } })) {
    counter++;
    orderNumber = `${prefix}-${counter.toString().padStart(3, "0")}`;
  }
  return orderNumber;
};

// Build order item rows at the wholesale (volume-tier or negotiated) price
// for the buyer's own role — Trade, Retailer and Distributor accounts each
// resolve against their own tiers (see resolveUnitPrice).
const buildTradeItems = async (lines: LineInput[], userId?: string, role: string = ROLES.TRADE) => {
  const items: OrderItemData[] = [];
  let net = 0;
  for (const line of lines) {
    const quantity = Math.max(1, Number(line.quantity) || 1);
    const product = await prisma.product.findUnique({
      where: { id: line.productId },
      select: { id: true, title: true, images: true },
    });
    if (!product) throw new Error(`Product not found: ${line.productId}`);

    const unitPrice = Number(
      (await resolveUnitPrice({
        productId: product.id,
        role,
        quantity,
        userId,
      })) ?? 0
    );
    const lineTotal = +(unitPrice * quantity).toFixed(2);

    net += lineTotal;

    items.push({
      productName: product.title,
      productId: product.id,
      productImage: product.images?.[0] ?? null,
      price: unitPrice,
      quantity,
      total: lineTotal,
    });
  }
  return { items, net };
};

// Whether this trade user has been approved for 30-day account invoicing.
const hasCredit = async (userId: string) => {
  const app = await prisma.accountApplication.findUnique({ where: { userId } });
  return Boolean(app?.creditApproved);
};

// Login-gated wholesale catalogue: products with their resolved unit price
// (under the caller's own Trade/Retailer/Distributor tiers) + the applicable
// volume tiers. Only approved wholesale accounts reach this.
export const getTradeCatalogue = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.userRole || ROLES.TRADE;
    const products = await prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, title: true, images: true, price: true, stock: true, categoryId: true },
    });

    const tiers = await prisma.pricingTier.findMany({ where: { role } });
    const tiersByProduct: Record<string, any[]> = {};
    const globalTiers: any[] = [];
    for (const t of tiers) {
      if (t.productId) (tiersByProduct[t.productId] ??= []).push(t);
      else globalTiers.push(t);
    }

    const data = await Promise.all(
      products.map(async (p) => ({
        ...p,
        tradePrice: await resolveUnitPrice({ productId: p.id, role, quantity: 1 }),
        tiers: (tiersByProduct[p.id] ?? globalTiers).sort(
          (a, b) => a.minQuantity - b.minQuantity
        ),
      }))
    );

    return res.status(200).json({ success: true, error: false, data });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Place a trade order (order by carton). paymentMethod "Invoice" requires
// admin-granted credit; otherwise the order is card/Stripe like a normal order.
export const placeTradeOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);

    const { lines, shippingAddress, phone, paymentMethod = "Card" } = req.body as {
      lines: LineInput[];
      shippingAddress: string;
      phone: string;
      paymentMethod?: string;
    };
    if (!Array.isArray(lines) || lines.length === 0) {
      return errorHandler(res, 400, "At least one order line is required", true);
    }
    if (!shippingAddress || !phone) {
      return errorHandler(res, 400, "Shipping address and phone are required", true);
    }

    if (paymentMethod === "Invoice" && !(await hasCredit(userId))) {
      return errorHandler(
        res,
        403,
        "30-day invoicing is not enabled on your account",
        true
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName:true, email: true },
    });

        const { items, net } = await buildTradeItems(lines, userId, req.userRole || ROLES.TRADE);
    const totals = await buildTotals({ net });

    const orderNumber = await generateTradeOrderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        firstName:user?.firstName ?? "",
        lastName:user?.lastName ?? "",
        email: user?.email ?? "",
        phone,
        shippingAddress,
        subtotal: totals.subtotal,
        shippingCost: totals.delivery,
        tax: totals.gst,
        total: totals.total,
        paymentMethod: paymentMethod === "Invoice" ? "30-Day Invoice" : "Card",
        paymentStatus: paymentMethod === "Invoice" ? "Invoiced" : "Pending",
        orderStatus: "Pending",
        items: { create: items },
      },
      include: { items: true },
    });
    const firstName = `${order.firstName ?? user?.firstName}`;
    const lastName = `${order.lastName ?? user?.lastName}`;

    // Email a tax invoice (reusing the existing invoice generator).
    if (user?.email) {
      const invoiceData = {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        firstName,
        lastName,
        email: user.email,
        phone: order.phone,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        items: order.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          price: i.price,
          total: i.total,
        })),
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        total: order.total,
      };
      generateInvoicePdf(invoiceData)
        .then((pdf) =>
          sendEmail({
            sendTo: user.email!,
            subject: `Trade order ${order.orderNumber}`,
            html: `<p>Hi ${user.firstName + " " + user.lastName},</p><p>Thanks for your trade order <b>${order.orderNumber}</b>. Your tax invoice is attached.</p>`,
            attachments: [{ filename: `invoice-${order.orderNumber}.pdf`, content: pdf }],
          })
        )
        .catch((e) => console.error("Trade invoice email error:", e));
    }

    return res.status(200).json({
      success: true,
      error: false,
      message: "Trade order placed",
      data: order,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Quick reorder — repeat a previous order in one tap. Re-resolves current trade
// prices (tiers may have changed) and reuses the previous shipping details.
export const quickReorder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { orderId } = req.body;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);
    if (!orderId) return errorHandler(res, 400, "orderId is required", true);

    const previous = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!previous) return errorHandler(res, 404, "Previous order not found", true);

    const lines = previous.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    req.body = {
      lines,
      shippingAddress: previous.shippingAddress,
      phone: previous.phone,
      paymentMethod: previous.paymentMethod === "30-Day Invoice" ? "Invoice" : "Card",
    };
    return placeTradeOrder(req, res);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// ── Standing / recurring orders (SHOULD) ────────────────────────────────────
export const listStandingOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);
    const orders = await prisma.standingOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, error: false, data: orders });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

export const upsertStandingOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);
    const { id, intervalDays, shippingAddress, phone, items, paymentMethod, status } =
      req.body;

    if (!id) {
      if (!shippingAddress || !phone || !Array.isArray(items) || items.length === 0) {
        return errorHandler(res, 400, "items, shippingAddress and phone are required", true);
      }
      const nextRunAt = new Date();
      nextRunAt.setDate(nextRunAt.getDate() + (Number(intervalDays) || 30));
      const created = await prisma.standingOrder.create({
        data: {
          userId,
          intervalDays: Number(intervalDays) || 30,
          nextRunAt,
          shippingAddress,
          phone,
          items,
          paymentMethod: paymentMethod ?? "Invoice",
        },
      });
      return res.status(200).json({ success: true, error: false, message: "Standing order created", data: created });
    }

    const data: any = {};
    if (intervalDays != null) data.intervalDays = Number(intervalDays);
    if (shippingAddress) data.shippingAddress = shippingAddress;
    if (phone) data.phone = phone;
    if (items) data.items = items;
    if (paymentMethod) data.paymentMethod = paymentMethod;
    if (status) data.status = status;

    const updated = await prisma.standingOrder.update({
      where: { id },
      data,
    });
    return res.status(200).json({ success: true, error: false, message: "Standing order updated", data: updated });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Scheduler hook: generate orders for all ACTIVE standing orders that are due.
// Call from a cron job. Re-resolves trade prices at run time.
export const runDueStandingOrders = async () => {
  const now = new Date();
  const due = await prisma.standingOrder.findMany({
    where: { status: "ACTIVE", nextRunAt: { lte: now } },
    include: { user: { select: { firstName: true, lastName:true, email: true, role: true } } },
  });

  for (const so of due) {
    try {
      const lines = (so.items as any as LineInput[]) ?? [];
      if (lines.length === 0) continue;
      const { items, net } = await buildTradeItems(lines, so.userId, so.user.role || ROLES.TRADE);
      const totals = await buildTotals({ net });
      const orderNumber = await generateTradeOrderNumber();

      await prisma.order.create({
        data: {
          orderNumber,
          userId: so.userId,
          firstName: so.user.firstName,
          lastName: so.user.lastName,
          email: so.user.email,
          phone: so.phone,
          shippingAddress: so.shippingAddress,
          subtotal: totals.subtotal,
          shippingCost: totals.delivery,
          tax: totals.gst,
          total: totals.total,
          paymentMethod: so.paymentMethod === "Invoice" ? "30-Day Invoice" : "Card",
          paymentStatus: so.paymentMethod === "Invoice" ? "Invoiced" : "Pending",
          orderStatus: "Pending",
          items: { create: items },
        },
      });

      const next = new Date(so.nextRunAt);
      next.setDate(next.getDate() + so.intervalDays);
      await prisma.standingOrder.update({
        where: { id: so.id },
        data: { nextRunAt: next },
      });
    } catch (e) {
      console.error("Standing order run failed:", so.id, e);
    }
  }
  return due.length;
};

// Credit terms + running account balance for the signed-in wholesale
// account (mainly used by the Distributor "Credit & balance" page).
// "Outstanding" is derived from Orders still on-account (paymentStatus
// "Invoiced") rather than a separate ledger — there's no payment-received
// tracking beyond paymentStatus today, so this is the accurate source.
export const getMyCreditStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);

    const application = await prisma.accountApplication.findUnique({ where: { userId } });
    const outstanding = await prisma.order.aggregate({
      where: { userId, paymentStatus: "Invoiced" },
      _sum: { total: true },
      _count: true,
    });

    const creditApproved = Boolean(application?.creditApproved);
    const creditLimit = application?.creditLimit ?? null;
    const outstandingBalance = outstanding._sum.total ?? 0;

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        creditApproved,
        creditLimit,
        outstandingBalance,
        outstandingOrderCount: outstanding._count,
        availableCredit: creditApproved && creditLimit != null ? +(creditLimit - outstandingBalance).toFixed(2) : null,
      },
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};