"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgotPasswordTemplate = ({ firstName, otp }) => {
    return `
    <h2>Dear ${firstName}!</h2>
    <p>We received a request to reset your Health U Shop password.</p>
    <p>Your password reset code is:</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: green;">${otp}</p>
    <p>This code expires in 10 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
    `;
};
exports.default = forgotPasswordTemplate;
