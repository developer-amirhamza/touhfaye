"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestEmail = exports.getEmailStatus = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const prisma_1 = require("../lib/prisma");
const sendEmail_1 = require("../config/sendEmail");
// Which email transport is active, without exposing any secrets.
const emailConfig = () => {
    const smtp = Boolean(process.env.SMTP_HOST);
    return {
        provider: smtp ? "SMTP" : process.env.RESEND_API_KEY ? "Resend (fallback)" : "NONE",
        smtpHost: smtp ? process.env.SMTP_HOST : null,
        smtpPort: smtp ? Number(process.env.SMTP_PORT) || 587 : null,
        from: process.env.EMAIL_FROM || "Touhfaye <info@mytouhfaye.com.au>",
    };
};
// GET /api/health/email — show the active email configuration (admin).
const getEmailStatus = async (_req, res) => {
    return res.status(200).json({ success: true, error: false, data: emailConfig() });
};
exports.getEmailStatus = getEmailStatus;
// POST /api/health/email — send a test email (admin).
// Body: { to?: string } — defaults to the logged-in admin's own address.
const sendTestEmail = async (req, res) => {
    try {
        let to = req.body?.to;
        if (!to && req.userId) {
            const admin = await prisma_1.prisma.user.findUnique({
                where: { id: req.userId },
                select: { email: true },
            });
            to = admin?.email;
        }
        if (!to)
            return (0, errorHandler_1.errorHandler)(res, 400, "No recipient — pass { to } or sign in", true);
        const cfg = emailConfig();
        const startedAt = Date.now();
        const result = await (0, sendEmail_1.sendEmail)({
            sendTo: to,
            subject: `Touhfaye email test — ${new Date().toLocaleString("en-AU")}`,
            html: `<div style="font-family:sans-serif;max-width:520px">
               <h2 style="color:#2E7D71">✅ Email delivery is working</h2>
               <p>This test was sent from the Touhfaye server.</p>
               <ul>
                 <li><b>Provider:</b> ${cfg.provider}</li>
                 <li><b>SMTP host:</b> ${cfg.smtpHost ?? "—"}</li>
                 <li><b>From:</b> ${cfg.from}</li>
                 <li><b>Sent at:</b> ${new Date().toISOString()}</li>
               </ul>
               <p style="color:#888;font-size:12px">If this landed in spam, check your SPF/DKIM DNS records.</p>
             </div>`,
        });
        return res.status(200).json({
            success: true,
            error: false,
            message: `Test email sent to ${to}`,
            data: {
                ...cfg,
                to,
                tookMs: Date.now() - startedAt,
                messageId: result?.messageId ?? result?.id ?? null,
                // nodemailer includes the SMTP server's acceptance response — useful proof.
                smtpResponse: result?.response ?? null,
            },
        });
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, `Test email FAILED: ${error.message}`, true);
    }
};
exports.sendTestEmail = sendTestEmail;
