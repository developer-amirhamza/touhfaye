import { Resend } from "resend";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Provider-agnostic email sender.
//
// Preferred path: standard SMTP via nodemailer — works with Postmark, SMTP2GO,
// SES, SendGrid, Brevo, or any other provider. Switching providers is a .env
// change only:
//   SMTP_HOST=smtp.postmarkapp.com
//   SMTP_PORT=587
//   SMTP_USER=<username / API token>
//   SMTP_PASS=<password / API token>
//   EMAIL_FROM="Aidble Care <hello@aidble.com.au>"
//
// Fallback: if SMTP_* is not configured, the existing Resend integration is
// used (RESEND_API_KEY), so nothing breaks during migration.
//
// NOTE: whichever provider you use, the sending domain must be verified there
// (SPF + DKIM DNS records) or customer inboxes will reject the mail.

interface Attachment {
    filename: string;
    content: Buffer | string;
}

interface Type {
    sendTo: string;
    subject: string;
    html: any;
    attachments?: Attachment[];
}

const FROM = process.env.EMAIL_FROM || "Bestiee <hello@mybestiee.com.au>";
const useSmtp = Boolean(process.env.SMTP_HOST);

// Reuse a single pooled SMTP connection across sends.
const transporter = useSmtp
    ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465, // 465 = implicit TLS
          auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
          },
          pool: true,
      })
    : null;

const resend = !useSmtp && process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

if (!useSmtp && !process.env.RESEND_API_KEY) {
    console.warn("Email: neither SMTP_HOST nor RESEND_API_KEY configured — emails will fail.");
}

export const sendEmail = async ({ sendTo, subject, html, attachments }: Type) => {
    try {
        if (transporter) {
            const info = await transporter.sendMail({
                from: FROM,
                to: sendTo,
                subject,
                html,
                attachments: attachments?.map((a) => ({
                    filename: a.filename,
                    content: a.content,
                })),
            });
            return info;
        }

        if (resend) {
            const { data, error } = await resend.emails.send({
                from: FROM,
                to: sendTo,
                subject,
                html,
                ...(attachments && attachments.length > 0 ? { attachments } : {}),
            });
            if (error) {
                // Surface the failure instead of swallowing it — callers already
                // handle rejections (.catch / try-catch).
                throw new Error(error.message || "Resend send failed");
            }
            return data;
        }

        throw new Error("No email provider configured (set SMTP_* or RESEND_API_KEY)");
    } catch (error: any) {
        console.error(`Email send failed (to: ${sendTo}, subject: ${subject}):`, error.message);
        throw error;
    }
};