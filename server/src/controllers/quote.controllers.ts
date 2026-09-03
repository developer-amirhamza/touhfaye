import { Response, Request } from "express";
import { errorHandler } from "../utils/errorHandler";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../config/sendEmail";
import { computeQuote, QuoteLineInput } from "../services/quoteCalculator";
import { generateQuotePdf } from "../utils/generateQuotePdf";
import { quoteUnitPrice } from "./pricing.controllers";

interface AuthRequest extends Request {
  userId?: string;
}

// Quote numbers like QT-001, QT-002, ...
const generateQuoteNumber = async () => {
  const prefix = "QT";
  const count = await prisma.quote.count();
  let counter = count + 1;
  let quoteNumber = `${prefix}-${counter.toString().padStart(3, "0")}`;
  while (await prisma.quote.findUnique({ where: { quoteNumber } })) {
    counter++;
    quoteNumber = `${prefix}-${counter.toString().padStart(3, "0")}`;
  }
  return quoteNumber;
};

// Preview totals without saving — drives the live calculator in the UI.
export const previewQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { supplyPeriod, lines } = req.body as {
      supplyPeriod: string;
      lines: QuoteLineInput[];
    };
    if (!supplyPeriod || !Array.isArray(lines) || lines.length === 0) {
      return errorHandler(res, 400, "supplyPeriod and at least one line are required", true);
    }
    const result = await computeQuote({ supplyPeriod, lines });
    return res.status(200).json({ success: true, error: false, data: result });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Create & save a quote (status DRAFT). Sets a 30-day validity by default.
export const createQuote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);

    const { supplyPeriod, lines, participantRef, planManagerEmail, notes, validDays } =
      req.body as {
        supplyPeriod: string;
        lines: QuoteLineInput[];
        participantRef?: string;
        planManagerEmail?: string;
        notes?: string;
        validDays?: number;
      };

    if (!supplyPeriod || !Array.isArray(lines) || lines.length === 0) {
      return errorHandler(res, 400, "supplyPeriod and at least one line are required", true);
    }

    const computed = await computeQuote({ supplyPeriod, lines });
    const quoteNumber = await generateQuoteNumber();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (validDays ?? 30));

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        userId,
        status: "DRAFT",
        participantRef: participantRef ?? null,
        planManagerEmail: planManagerEmail ?? null,
        supplyPeriod,
        subtotal: computed.subtotal,
        discount: computed.discount,
        delivery: computed.delivery,
        gst: computed.gst,
        total: computed.total,
        validUntil,
        notes: notes ?? null,
        items: { create: computed.items },
      },
      include: { items: true },
    });

    return res.status(200).json({
      success: true,
      error: false,
      message: "Quote saved",
      data: quote,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// List the coordinator's quote history.
export const getMyQuotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);
    const quotes = await prisma.quote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    return res.status(200).json({ success: true, error: false, data: quotes });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Get a single quote (must belong to the requesting coordinator).
const findOwnedQuote = async (id: string, userId: string) =>
  prisma.quote.findFirst({
    where: { id, userId },
    include: { items: true, user: { select: { firstName: true, lastName:true, email: true } } },
  });

export const getQuote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);
    const quote = await findOwnedQuote(String(id), userId);
    if (!quote) return errorHandler(res, 404, "Quote not found", true);
    return res.status(200).json({ success: true, error: false, data: quote });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Duplicate an existing quote into a new DRAFT.
export const duplicateQuote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.body;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);
    const source = await findOwnedQuote(id, userId);
    if (!source) return errorHandler(res, 404, "Quote not found", true);

    const quoteNumber = await generateQuoteNumber();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const copy = await prisma.quote.create({
      data: {
        quoteNumber,
        userId,
        status: "DRAFT",
        participantRef: source.participantRef,
        planManagerEmail: source.planManagerEmail,
        supplyPeriod: source.supplyPeriod,
        subtotal: source.subtotal,
        discount: source.discount,
        delivery: source.delivery,
        gst: source.gst,
        total: source.total,
        validUntil,
        notes: source.notes,
        items: {
          create: source.items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            size: i.size,
            absorbency: i.absorbency,
            dailyPads: i.dailyPads,
            days: i.days,
            totalPads: i.totalPads,
            unitPrice: i.unitPrice,
            lineTotal: i.lineTotal,
          })),
        },
      },
      include: { items: true },
    });

    return res.status(200).json({ success: true, error: false, message: "Quote duplicated", data: copy });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Build the quote PDF + email it to the coordinator (and optionally the
// participant / plan manager). Marks the quote SENT.
export const emailQuote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id, alsoSendTo } = req.body;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);
    const quote = await findOwnedQuote(id, userId);
    if (!quote) return errorHandler(res, 404, "Quote not found", true);
    const fullName = quote.user?.firstName + " " + quote.user?.lastName;

    const pdf = await generateQuotePdf({
      quoteNumber: quote.quoteNumber,
      createdAt: quote.createdAt,
      validUntil: quote.validUntil,
      coordinatorName:fullName,
      coordinatorEmail: quote.user.email,
      participantRef: quote.participantRef,
      planManagerEmail: quote.planManagerEmail,
      supplyPeriod: quote.supplyPeriod,
      items: quote.items,
      subtotal: quote.subtotal,
      discount: quote.discount,
      delivery: quote.delivery,
      gst: quote.gst,
      total: quote.total,
    });

    const recipients = [quote.user.email];
    if (alsoSendTo) recipients.push(alsoSendTo);
    if (quote.planManagerEmail) recipients.push(quote.planManagerEmail);

    await sendEmail({
      sendTo: Array.from(new Set(recipients)).join(","),
      subject: `Your Bestiee quote ${quote.quoteNumber}`,
      html: `<p>Hi ${fullName},</p>
             <p>Please find attached your quote <b>${quote.quoteNumber}</b>
             (${quote.supplyPeriod} supply), valid until
             ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString("en-AU") : "—"}.</p>
             <p>Total: <b>$${quote.total.toFixed(2)}</b></p>
             <p>— The Bestiee team</p>`,
      attachments: [{ filename: `quote-${quote.quoteNumber}.pdf`, content: pdf }],
    });

    await prisma.quote.update({ where: { id: quote.id }, data: { status: "SENT" } });

    return res.status(200).json({ success: true, error: false, message: "Quote emailed" });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Convert a quote into a real order.
export const convertQuoteToOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id, shippingAddress, phone } = req.body;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);
    const quote = await findOwnedQuote(id, userId);
    if (!quote) return errorHandler(res, 404, "Quote not found", true);
    if (quote.convertedOrderId)
      return errorHandler(res, 400, "Quote already converted to an order", true);

    // Generate an order number (ORD prefix to match the order controller).
    const prefix = "ORD";
    const count = await prisma.order.count();
    let counter = count + 1;
    let orderNumber = `${prefix}-${counter.toString().padStart(3, "0")}`;
    while (await prisma.order.findUnique({ where: { orderNumber } })) {
      counter++;
      orderNumber = `${prefix}-${counter.toString().padStart(3, "0")}`;
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        firstName:quote.user.firstName,
        lastName:quote.user.lastName,
        email: quote.user.email,
        phone: phone ?? "",
        shippingAddress: shippingAddress ?? "",
        subtotal: quote.subtotal,
        shippingCost: quote.delivery,
        tax: quote.gst,
        total: quote.total,
        paymentMethod: "NDIS Quote",
        paymentStatus: "Pending",
        orderStatus: "Pending",
        items: {
          create: quote.items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            price: i.unitPrice,
            quantity: i.totalPads,
            total: i.lineTotal,
          })),
        },
      },
      include: { items: true },
    });

    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "CONVERTED", convertedOrderId: order.id },
    });

    return res.status(200).json({
      success: true,
      error: false,
      message: "Quote converted to order",
      data: order,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};