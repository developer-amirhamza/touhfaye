import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { errorHandler } from "../utils/errorHandler";
import { sendEmail } from "../config/sendEmail";

// Buyer types map to a label + whether they are a B2B lead worth an instant
// internal alert (per the launch plan: "if trade type → email Audrey").
const BUYER_TYPES: Record<string, { label: string; b2b: boolean }> = {
    USER: { label: "User / for myself", b2b: false },
    CARER: { label: "Carer / family member", b2b: false },
    PHARMACY: { label: "Pharmacy", b2b: true },
    AGED_CARE: { label: "Aged care provider", b2b: true },
    NDIS_PROVIDER: { label: "NDIS provider / coordinator", b2b: true },
    DISTRIBUTOR: { label: "Overseas distributor", b2b: true },
};

// Internal address that receives hot B2B lead alerts. Set WAITLIST_ALERT_EMAIL
// in the environment; falls back to the configured from-address inbox.
const ALERT_TO =
    process.env.WAITLIST_ALERT_EMAIL ||
    (process.env.EMAIL_FROM || "").match(/<(.+)>/)?.[1] ||
    process.env.EMAIL_FROM ||
    "";

// Public: join the pre-launch waitlist.
export const joinWaitlist = async (req: Request, res: Response) => {
    try {
        const { name, email, postcode, country, buyerType, consent, utm } = req.body;

        if (!name?.trim() || !email?.trim() || !postcode?.trim() || !buyerType) {
            return errorHandler(res, 400, "Please fill name, email, postcode and buyer type", true);
        }
        if (!BUYER_TYPES[buyerType]) {
            return errorHandler(res, 400, "Invalid buyer type", true);
        }
        // Basic email shape check.
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return errorHandler(res, 400, "Please enter a valid email address", true);
        }

        const cleanEmail = email.trim().toLowerCase();
        const consented = Boolean(consent);

        // Upsert so re-submitting the same email updates the record instead of
        // erroring on the unique constraint (people often sign up twice).
        const entry = await prisma.waitlistEntry.upsert({
            where: { email: cleanEmail },
            update: {
                name: name.trim(),
                postcode: postcode.trim(),
                country: country?.trim() || "Australia",
                buyerType,
                consent: consented,
                consentAt: consented ? new Date() : null,
                utm: utm?.trim() || undefined,
            },
            create: {
                name: name.trim(),
                email: cleanEmail,
                postcode: postcode.trim(),
                country: country?.trim() || "Australia",
                buyerType,
                consent: consented,
                consentAt: consented ? new Date() : null,
                utm: utm?.trim() || null,
            },
        });

        const meta = BUYER_TYPES[buyerType];

        // Fire-and-forget notifications so the visitor's response is instant.
        // 1) Instant internal alert for B2B leads.
        if (meta.b2b && ALERT_TO) {
            sendEmail({
                sendTo: ALERT_TO,
                subject: `🔥 New B2B waitlist lead — ${meta.label}`,
                html: `
                    <h2>New ${meta.label} waitlist signup</h2>
                    <table cellpadding="6" style="border-collapse:collapse">
                        <tr><td><b>Name</b></td><td>${entry.name}</td></tr>
                        <tr><td><b>Email</b></td><td>${entry.email}</td></tr>
                        <tr><td><b>Postcode</b></td><td>${entry.postcode}</td></tr>
                        <tr><td><b>Country</b></td><td>${entry.country}</td></tr>
                        <tr><td><b>Type</b></td><td>${meta.label}</td></tr>
                        <tr><td><b>Source</b></td><td>${entry.utm || "direct"}</td></tr>
                    </table>
                    <p>Reach out within 2 business days.</p>`,
            }).catch((e) => console.error("Waitlist B2B alert failed:", e.message));
        }

        // 2) Confirmation email to the signer (only if they consented).
        if (consented) {
            sendEmail({
                sendTo: cleanEmail,
                subject: "You're on the Bestiee waitlist 🎉",
                html: `
                    <h2>Freedom is coming.</h2>
                    <p>Hi ${entry.name.split(" ")[0]}, thanks for joining the Bestiee waitlist!</p>
                    <p>We'll email you the moment we launch, plus helpful guides along the way.
                    Premium incontinence wear that feels like everyday underwear — dignity, comfort, freedom.</p>
                    <p style="color:#888;font-size:13px">You can unsubscribe anytime. Your details stay private.</p>`,
            }).catch((e) => console.error("Waitlist welcome email failed:", e.message));
        }

        return res.status(200).json({
            success: true,
            error: false,
            message: "You're on the waitlist!",
            data: { id: entry.id, buyerType, b2b: meta.b2b },
        });
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

// Admin: list all waitlist entries (newest first).
export const listWaitlist = async (_req: Request, res: Response) => {
    try {
        const entries = await prisma.waitlistEntry.findMany({ orderBy: { createdAt: "desc" } });
        return res.status(200).json({ success: true, error: false, data: entries });
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};
