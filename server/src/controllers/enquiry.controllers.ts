import { Response, Request } from "express";
import { errorHandler } from "../utils/errorHandler";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../config/sendEmail";
import { generateQuotePdf } from "../utils/generateQuotePdf";

interface AuthRequest extends Request {
  userId?: string;
}

const TEAM_EMAIL = "hello@mybestiee.com.au";

// Submit a funding-support enquiry. If a quoteId is supplied, the quote PDF is
// attached so the team can offer a payment plan / partial supply / hardship
// support. No coordinator should hit a dead end — this always routes to a human.
export const submitFundingEnquiry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { participantNeed, availableFunding, message, quoteId, firstName,lastName, email, phone } =
      req.body;
      const fullName = firstName + " " +  lastName;
    const enquiry = await prisma.enquiry.create({
      data: {
        type: "FUNDING_SUPPORT",
        status: "NEW",
        userId: userId ?? null,
        name: fullName ?? null,
        email: email ?? null,
        phone: phone ?? null,
        participantNeed: participantNeed ?? null,
        availableFunding: availableFunding ?? null,
        message: message ?? null,
        quoteId: quoteId ?? null,
      },
    });

    // Build email, attaching the related quote PDF when present.
    const attachments: { filename: string; content: Buffer }[] = [];
    if (quoteId) {
      const quote:any = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { items: true, user: { select: { firstName: true, lastName:true, email: true } } },
      });
      const fullName = quote.user?.firstName + " " +  quote.user?.lastName;
      if (quote) {
        try {
          const pdf = await generateQuotePdf({
            quoteNumber: quote.quoteNumber,
            createdAt: quote.createdAt,
            validUntil: quote.validUntil,
            coordinatorName: fullName,
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
          attachments.push({ filename: `quote-${quote.quoteNumber}.pdf`, content: pdf });
        } catch {
          /* attachment is best-effort */
        }
      }
    }

    sendEmail({
      sendTo: TEAM_EMAIL,
      subject: `Funding support request${quoteId ? " (quote attached)" : ""}`,
      html: `<p>A funding support enquiry has been submitted.</p>
             <ul>
               <li><b>From:</b> ${firstName ?? "-"} (${email ?? "-"}, ${phone ?? "-"})</li>
               <li><b>Participant need:</b> ${participantNeed ?? "-"}</li>
               <li><b>Available funding:</b> ${availableFunding ?? "-"}</li>
               <li><b>Message:</b> ${message ?? "-"}</li>
             </ul>`,
      attachments: attachments.length ? attachments : undefined,
    }).catch(() => { });

    return res.status(200).json({
      success: true,
      error: false,
      message: "Thanks — our team will be in touch about funding options.",
      data: enquiry,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Submit a general / trade enquiry.
export const submitEnquiry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { type, firstName,lastName, email, phone, message } = req.body;
    if (!message) return errorHandler(res, 400, "A message is required", true);
    const fullName = firstName + " " +  lastName;
    const enquiry = await prisma.enquiry.create({
      data: {
        type: type === "TRADE" ? "TRADE" : "GENERAL",
        status: "NEW",
        userId: userId ?? null,
        name: fullName ?? null,
        email: email ?? null,
        phone: phone ?? null,
        message,
      },
    });

    sendEmail({
      sendTo: TEAM_EMAIL,
      subject: `New ${enquiry.type.toLowerCase()} enquiry`,
      html: `<p>A new enquiry has been submitted.</p>
             <ul>
               <li><b>From:</b> ${fullName ?? "-"} (${email ?? "-"}, ${phone ?? "-"})</li>
               <li><b>Message:</b> ${message}</li>
             </ul>`,
    }).catch(() => { });

    return res.status(200).json({
      success: true,
      error: false,
      message: "Thanks — we'll be in touch shortly.",
      data: enquiry,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Submit a B2B "book a meeting" request — we call them, no calendar/video
// integration. Always routes to a human, same as the other enquiry types.
export const submitMeetingRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { firstName, lastName, email, phone, company, preferredAt, message } = req.body;
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    if (!fullName.trim()) return errorHandler(res, 400, "First name and surname are required", true);
    if (!email) return errorHandler(res, 400, "Email address is required", true);
    if (!phone) return errorHandler(res, 400, "A phone number is required so we can call you", true);
    if (!message) return errorHandler(res, 400, "Please tell us what you'd like to cover", true);

    const enquiry = await prisma.enquiry.create({
      data: {
        type: "MEETING",
        status: "NEW",
        userId: userId ?? null,
        name: fullName,
        email,
        phone,
        company: company ?? null,
        message,
        preferredAt: preferredAt ? new Date(preferredAt) : null,
      },
    });

    const whenLabel = enquiry.preferredAt
      ? new Date(enquiry.preferredAt).toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short", timeZone: "Australia/Sydney" })
      : "No preferred time given";

    sendEmail({
      sendTo: TEAM_EMAIL,
      subject: `Meeting request — ${fullName}${company ? ` (${company})` : ""}`,
      html: `<p>A B2B customer has asked us to call them.</p>
             <ul>
               <li><b>From:</b> ${fullName} (${email}, ${phone})</li>
               ${company ? `<li><b>Company:</b> ${company}</li>` : ""}
               <li><b>Preferred time:</b> ${whenLabel}</li>
               <li><b>What they want to cover:</b> ${message}</li>
             </ul>`,
    }).catch(() => { });

    sendEmail({
      sendTo: email,
      subject: "We've got your meeting request",
      html: `<h2>Thanks, ${firstName || fullName}</h2>
             <p>We've received your request${enquiry.preferredAt ? ` for <b>${whenLabel}</b>` : ""} and our team will call you on <b>${phone}</b> to confirm.</p>
             <p style="color:#888;font-size:13px">No cost, no obligation — just a conversation.</p>`,
    }).catch((e) => console.error("Meeting request confirmation email failed:", e.message));

    return res.status(200).json({
      success: true,
      error: false,
      message: "Thanks — we'll call you to confirm a time.",
      data: enquiry,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Admin: list enquiries, optionally filtered by type/status.
export const listEnquiries = async (req: Request, res: Response) => {
  try {
    const { type, status } = req.query;
    const where: any = {};
    if (type) where.type = String(type);
    if (status) where.status = String(status);
    const enquiries = await prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, error: false, data: enquiries });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Admin: update an enquiry's status (NEW -> IN_PROGRESS -> RESOLVED).
export const updateEnquiryStatus = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId;
    const { id, status } = req.body;
    if (!id || !status) return errorHandler(res, 400, "id and status are required", true);
    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: {
        status,
        handledBy: adminId ?? null,
        handledAt: status === "RESOLVED" ? new Date() : null,
      },
    });
    return res.status(200).json({
      success: true,
      error: false,
      message: "Enquiry updated",
      data: enquiry,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};