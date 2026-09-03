import { Response, Request } from "express";
import { errorHandler } from "../utils/errorHandler";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../config/sendEmail";
import { generateInvoicePdf } from "../utils/generateInvoicePdf";
import { resolveUnitPrice, buildTotals, getViewerRole } from "../services/pricing";

interface AuthRequest extends Request {
  userId?: string;
}

interface LineInput {
  productId: string;
  quantity: number;
}

const generateOrderNumber = async () => {
  const date = new Date();
  const prefix = `SUB-${date.getFullYear()}${(date.getMonth() + 1)
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

// Build order items for the given lines, priced at the subscriber's own
// role (Trade/Retailer/Distributor/NDIS coordinator/Consumer — whichever
// price is set for that role, falling back to the main retail price).
// Rejects products that are inactive/deleted or out of stock, and rejects a
// line whose resolved unit price comes back as 0/NaN (misconfigured pricing).
const buildConsumerItems = async (lines: LineInput[], userId: string) => {
  const role = await getViewerRole(userId);
  const items = [];
  let net = 0;
  for (const line of lines) {
    const quantity = Math.max(1, Number(line.quantity) || 1);
    const product = await prisma.product.findUnique({
      where: { id: line.productId },
      select: { id: true, title: true, images: true, isActive: true, deletedAt: true, stock: true },
    });
    if (!product) throw new Error(`Product not found: ${line.productId}`);
    if (!product.isActive || product.deletedAt) {
      throw new Error(`"${product.title}" is no longer available`);
    }
    if (product.stock < quantity) {
      throw new Error(`Only ${product.stock} left in stock for "${product.title}"`);
    }

    const unitPrice = Number(
      (await resolveUnitPrice({
        productId: product.id,
        role,
        quantity,
        userId,
      })) ?? 0
    );
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error(`"${product.title}" has no price configured`);
    }
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

// Decrement stock for the given lines inside the passed transaction, throwing
// if a concurrent order already consumed the stock (race-safe conditional update).
const decrementStock = async (tx: any, lines: LineInput[]) => {
  for (const line of lines) {
    const quantity = Math.max(1, Number(line.quantity) || 1);
    const updated = await tx.product.updateMany({
      where: { id: line.productId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (updated.count === 0) {
      throw new Error(`Stock changed for one of your items — please review your order.`);
    }
  }
};

// List the consumer's subscriptions.
export const listSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);
    const subs = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, error: false, data: subs });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Create or update (pause/resume/cancel/edit) a subscription.
export const upsertSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);
    const { id, intervalDays, shippingAddress, phone, items, status } = req.body;

    if (!id) {
      if (!shippingAddress || !phone || !Array.isArray(items) || items.length === 0) {
        return errorHandler(res, 400, "items, shippingAddress and phone are required", true);
      }
      const nextRunAt = new Date();
      nextRunAt.setDate(nextRunAt.getDate() + (Number(intervalDays) || 30));
      const created = await prisma.subscription.create({
        data: {
          userId,
          intervalDays: Number(intervalDays) || 30,
          nextRunAt,
          shippingAddress,
          phone,
          items,
        },
      });
      return res.status(200).json({ success: true, error: false, message: "Subscription created", data: created });
    }

    const data: any = {};
    if (intervalDays != null) data.intervalDays = Number(intervalDays);
    if (shippingAddress) data.shippingAddress = shippingAddress;
    if (phone) data.phone = phone;
    if (items) data.items = items;
    if (status) data.status = status;

    const updated = await prisma.subscription.update({ where: { id }, data });
    return res.status(200).json({ success: true, error: false, message: "Subscription updated", data: updated });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// One-click reorder — recreate a previous order instantly at current prices.
export const oneClickReorder = async (req: AuthRequest, res: Response) => {
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
    const { items, net } = await buildConsumerItems(lines, userId);
    const totals = await buildTotals({ net });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName:true, email: true },
    });

    const orderNumber = await generateOrderNumber();
    const order = await prisma.$transaction(async (tx) => {
      await decrementStock(tx, lines);
      return tx.order.create({
        data: {
          orderNumber,
          userId,
          firstName: user?.firstName ?? previous.firstName ?? "",
          lastName: user?.lastName ?? previous.lastName ?? "",
          email: user?.email ?? previous.email,
          phone: previous.phone,
          shippingAddress: previous.shippingAddress,
          subtotal: totals.subtotal,
          shippingCost: totals.delivery,
          tax: totals.gst,
          total: totals.total,
          paymentMethod: "Card",
          paymentStatus: "Pending",
          orderStatus: "Pending",
          items: { create: items },
        },
        include: { items: true },
      });
    });

    // Confirmation email + invoice, same as every other order path.
    const email = user?.email ?? previous.email;
    if (email) {
      const firstName = `${order.firstName}` || previous.firstName || "";
      const lastName = `${order.lastName}` || previous.lastName || "";
      const invoiceData = {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        firstName,
        lastName,
        email,
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
            sendTo: email,
            subject: `Order Confirmed – ${order.orderNumber}`,
            html: `<p>Hi ${firstName + " " + lastName},</p><p>Your reorder <b>${order.orderNumber}</b> has been placed. Invoice attached.</p>`,
            attachments: [{ filename: `invoice-${order.orderNumber}.pdf`, content: pdf }],
          })
        )
        .catch((e) => console.error("Reorder invoice email error:", e));
    }

    return res.status(200).json({
      success: true,
      error: false,
      message: "Reorder placed",
      data: order,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Scheduler hook: generate orders for all ACTIVE subscriptions that are due.
// Applies the configurable consumer subscription discount. Call from a cron job.
export const runDueSubscriptions = async () => {
  const now = new Date();
  const due = await prisma.subscription.findMany({
    where: { status: "ACTIVE", nextRunAt: { lte: now } },
    include: { user: { select: { firstName: true, lastName:true, email: true } } },
  });

  for (const sub of due) {
    try {
      const lines = (sub.items as any as LineInput[]) ?? [];
      if (lines.length === 0) continue;
      const { items, net } = await buildConsumerItems(lines, sub.userId);
      // Tiered Subscribe & Save discount, based on this subscription's cadence.
      const totals = await buildTotals({ net, subscriptionIntervalDays: sub.intervalDays });
      const orderNumber = await generateOrderNumber();

      const order = await prisma.$transaction(async (tx) => {
        await decrementStock(tx, lines);
        return tx.order.create({
          data: {
            orderNumber,
            userId: sub.userId,
            firstName: sub.user.firstName,
            lastName: sub.user.lastName,
            email: sub.user.email,
            phone: sub.phone,
            shippingAddress: sub.shippingAddress,
            subtotal: totals.subtotal,
            discount: totals.discount,
            shippingCost: totals.delivery,
            tax: totals.gst,
            total: totals.total,
            paymentMethod: "Card",
            paymentStatus: "Pending",
            orderStatus: "Pending",
            items: { create: items },
          },
          include: { items: true },
        });
      });

      const next = new Date(sub.nextRunAt);
      next.setDate(next.getDate() + sub.intervalDays);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextRunAt: next },
      });
        const firstName = `${order.firstName}` || sub?.user?.firstName || "";
      const lastName = `${order.lastName}` || sub?.user?.lastName || "";

      // Discreet confirmation email with invoice.
      if (sub.user.email) {
        const invoiceData = {
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          firstName,
          lastName,
          email: sub.user.email,
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
              sendTo: sub.user.email!,
              subject: `Your subscription order ${order.orderNumber} is on its way`,
              html: `<p>Hi ${sub.user.firstName + " " + sub.user.lastName},</p><p>Your recurring order <b>${order.orderNumber}</b> has been placed and will be shipped in plain, discreet packaging. Invoice attached.</p>`,
              attachments: [{ filename: `invoice-${order.orderNumber}.pdf`, content: pdf }],
            })
          )
          .catch((e) => console.error("Subscription email error:", e));
      }
    } catch (e) {
      console.error("Subscription run failed:", sub.id, e);
    }
  }
  return due.length;
};
