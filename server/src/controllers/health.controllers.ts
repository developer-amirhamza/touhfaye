import { Request, Response } from "express";
import { errorHandler } from "../utils/errorHandler";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../config/sendEmail";

interface AuthRequest extends Request {
  userId?: string;
}

// Which email transport is active, without exposing any secrets.
const emailConfig = () => {
  const smtp = Boolean(process.env.SMTP_HOST);
  return {
    provider: smtp ? "SMTP" : process.env.RESEND_API_KEY ? "Resend (fallback)" : "NONE",
    smtpHost: smtp ? process.env.SMTP_HOST : null,
    smtpPort: smtp ? Number(process.env.SMTP_PORT) || 587 : null,
    from: process.env.EMAIL_FROM || "Bestiee <info@mybestiee.com.au>",
  };
};

// GET /api/health/email — show the active email configuration (admin).
export const getEmailStatus = async (_req: Request, res: Response) => {
  return res.status(200).json({ success: true, error: false, data: emailConfig() });
};

// POST /api/health/email — send a test email (admin).
// Body: { to?: string } — defaults to the logged-in admin's own address.
export const sendTestEmail = async (req: AuthRequest, res: Response) => {
  try {
    let to = req.body?.to as string | undefined;
    if (!to && req.userId) {
      const admin = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { email: true },
      });
      to = admin?.email;
    }
    if (!to) return errorHandler(res, 400, "No recipient — pass { to } or sign in", true);

    const cfg = emailConfig();
    const startedAt = Date.now();
    const result: any = await sendEmail({
      sendTo: to,
      subject: `Bestiee email test — ${new Date().toLocaleString("en-AU")}`,
      html: `<div style="font-family:sans-serif;max-width:520px">
               <h2 style="color:#2E7D71">✅ Email delivery is working</h2>
               <p>This test was sent from the Bestiee server.</p>
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
  } catch (error: any) {
    return errorHandler(res, 500, `Test email FAILED: ${error.message}`, true);
  }
};
