"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const resend_1 = require("resend");
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const FROM = process.env.EMAIL_FROM || "Touhfaye <hello@mytouhfaye.com.au>";
const useSmtp = Boolean(process.env.SMTP_HOST);
// Reuse a single pooled SMTP connection across sends.
const transporter = useSmtp
    ? nodemailer_1.default.createTransport({
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
const resend = !useSmtp && process.env.RESEND_API_KEY ? new resend_1.Resend(process.env.RESEND_API_KEY) : null;
if (!useSmtp && !process.env.RESEND_API_KEY) {
    console.warn("Email: neither SMTP_HOST nor RESEND_API_KEY configured — emails will fail.");
}
const sendEmail = async ({ sendTo, subject, html, attachments }) => {
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
    }
    catch (error) {
        console.error(`Email send failed (to: ${sendTo}, subject: ${subject}):`, error.message);
        throw error;
    }
};
exports.sendEmail = sendEmail;
