"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const verifyEmailTemplate = ({ firstName, url }) => {
    return `
    <h2>Dear ${firstName}!</h2>
    <p>Thank you for registering Health U Shop.</p>
    <p>Please click for verify your email.</p>
    <a href="${url}" target="_blank" rel="noopener noreferrer" style="color:white; background:green; padding: 5px 10px; margin-top: 10px; border-radius: 10px; display:inline-block; text-decoration:none;" >
    Verify Email</a>
    `;
};
exports.default = verifyEmailTemplate;
