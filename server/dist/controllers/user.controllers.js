"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserDetails = exports.getAllUsers = exports.GetUserDetails = exports.SignUp = exports.SignOut = exports.SignIn = exports.uploadAvatar = exports.updateUserByAdmin = exports.refreshToken = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.verifyEmail = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const errorHandler_1 = require("../utils/errorHandler");
const sendEmail_1 = require("../config/sendEmail");
const prisma_1 = require("../lib/prisma");
const refreshToken_1 = __importDefault(require("../utils/refreshToken"));
const accessToken_1 = __importDefault(require("../utils/accessToken"));
const verifyEmailTemplate_1 = __importDefault(require("../utils/verifyEmailTemplate"));
const forgotPasswordTemplate_1 = __importDefault(require("../utils/forgotPasswordTemplate"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const cloudinary_1 = require("../config/cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SignUp = async (req, res) => {
    try {
        console.log(req.body, "test user");
        const { firstName, lastName, email, mobile, password } = req.body;
        const id = (0, uuid_1.v4)();
        if (!firstName || !email || !password) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "Provide the name, email and password",
            });
        }
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return (0, errorHandler_1.errorHandler)(res, 400, "This user already exists", false);
        }
        ;
        const salt = await bcrypt_1.default.genSalt(10);
        const hashPassword = await bcrypt_1.default.hash(password, salt);
        const user = await prisma_1.prisma.user.create({
            data: {
                id,
                firstName,
                lastName,
                email,
                // Self-service signup always creates a plain consumer account —
                // never trust a client-supplied role here (it would otherwise let
                // anyone POST role: "ADMIN"/"OWNER" and grant themselves access).
                // Business account types (Trade/Retailer/Distributor/NDIS) go
                // through the authenticated /apply flow + admin approval instead.
                role: "CONSUMER",
                password: hashPassword,
                verify_email: false,
                status: "ACTIVE",
                mobile: mobile?.toString(),
            },
        });
        const verifyEmailUrl = `${process.env.CLIENT_URL}/verify-email?code=${user.id}`;
        // Email failure shouldn't fail the signup — the account is already created.
        const emailResult = await (0, sendEmail_1.sendEmail)({
            sendTo: email,
            subject: "Verify email from Touhfaye",
            html: (0, verifyEmailTemplate_1.default)({
                firstName,
                url: verifyEmailUrl,
            }),
        }).catch((err) => {
            console.error("Verify email failed:", err.message);
            return null;
        });
        res.status(200).json({
            success: true,
            error: false,
            message: "Your account has been created successfully!",
            data: emailResult,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: true,
            message: error.message || "Internal server error!",
        });
    }
};
exports.SignUp = SignUp;
const verifyEmail = async (req, res) => {
    try {
        const { code } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { id: code } });
        if (!user) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Invalid code entered!");
        }
        const updateUser = await prisma_1.prisma.user.update({
            where: { id: code },
            data: { verify_email: true }
        });
        res.status(200).json({
            success: true,
            error: false,
            message: "Your email verified successfully!",
            data: updateUser,
        });
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, `${error.message} || "Internal server error!"`);
    }
};
exports.verifyEmail = verifyEmail;
// Forgot password (signed-out flow): email a one-time code, valid for 10
// minutes. Always responds with the same generic message whether or not the
// account exists, so this endpoint can't be used to check which emails are
// registered.
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Email is required", true);
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (user) {
            const otp = crypto_1.default.randomInt(100000, 1000000).toString();
            const otpHash = await bcrypt_1.default.hash(otp, await bcrypt_1.default.genSalt(10));
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    forgot_password_otp: otpHash,
                    forgot_password_expire: new Date(Date.now() + 10 * 60 * 1000),
                },
            });
            await (0, sendEmail_1.sendEmail)({
                sendTo: email,
                subject: "Reset your Health U Shop password",
                html: (0, forgotPasswordTemplate_1.default)({ firstName: user.firstName || "there", otp }),
            }).catch((err) => console.error("Forgot-password email failed:", err.message));
        }
        res.status(200).json({
            success: true,
            error: false,
            message: "If an account exists for that email, a password reset code has been sent.",
        });
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.forgotPassword = forgotPassword;
// Reset password using the emailed OTP (no login required).
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Email, code and new password are required", true);
        }
        if (newPassword.length < 6) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Password must be at least 6 characters", true);
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user || !user.forgot_password_otp || !user.forgot_password_expire) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Invalid or expired reset code", true);
        }
        if (user.forgot_password_expire.getTime() < Date.now()) {
            return (0, errorHandler_1.errorHandler)(res, 400, "This reset code has expired. Please request a new one.", true);
        }
        const otpMatches = await bcrypt_1.default.compare(otp, user.forgot_password_otp);
        if (!otpMatches) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Invalid or expired reset code", true);
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const hashPassword = await bcrypt_1.default.hash(newPassword, salt);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashPassword,
                forgot_password_otp: null,
                forgot_password_expire: null,
            },
        });
        res.status(200).json({
            success: true,
            error: false,
            message: "Password reset successfully. You can now sign in.",
        });
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.resetPassword = resetPassword;
// Change password for an already-authenticated user (profile settings) —
// requires the current password, unlike the OTP-based forgot-password reset.
const changePassword = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return (0, errorHandler_1.errorHandler)(res, 401, "Unauthorized", true);
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Current and new password are required", true);
        }
        if (newPassword.length < 6) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Password must be at least 6 characters", true);
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return (0, errorHandler_1.errorHandler)(res, 404, "User not found", true);
        }
        const matchPassword = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!matchPassword) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Current password is incorrect", true);
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const hashPassword = await bcrypt_1.default.hash(newPassword, salt);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { password: hashPassword },
        });
        res.status(200).json({
            success: true,
            error: false,
            message: "Password changed successfully",
        });
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.changePassword = changePassword;
const SignIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            console.log("Please provide the email or password");
            return (0, errorHandler_1.errorHandler)(res, 404, "Please provide the email or password", true);
        }
        ;
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return (0, errorHandler_1.errorHandler)(res, 404, "User not found!", true);
        }
        ;
        // password verify
        const matchPassword = await bcrypt_1.default.compare(password, user.password);
        if (!matchPassword) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Incorrect Password", true);
        }
        ;
        const refreshToken = await (0, refreshToken_1.default)(user.id);
        const accessToken = await (0, accessToken_1.default)(user.id);
        // update user status
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                last_login_date: new Date(),
                refresh_token: refreshToken
            }
        });
        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None",
        };
        res.cookie("accessToken", accessToken, cookiesOption);
        res.cookie("refreshToken", refreshToken, cookiesOption);
        res.status(200).json({
            success: true,
            error: false,
            message: "User signed in successfully",
            data: { accessToken, refreshToken, user }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: true,
            message: error.message || "Internal server error!"
        });
    }
};
exports.SignIn = SignIn;
// refresh token
const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req?.headers?.authorization?.split(" ")[1];
        if (!refreshToken)
            return (0, errorHandler_1.errorHandler)(res, 401, "No refresh token provided", true);
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
        if (!decoded) {
            return (0, errorHandler_1.errorHandler)(res, 401, "Invalid or expired refresh token");
        }
        ;
        const userId = decoded._id;
        const newAccessToken = await (0, accessToken_1.default)(userId);
        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None",
        };
        res.cookie("accessToken", newAccessToken, cookiesOption);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.refreshToken = refreshToken;
const SignOut = async (req, res) => {
    const userId = req.userId; // get from auth
    console.log(userId, "userid");
    if (!userId) {
        return (0, errorHandler_1.errorHandler)(res, 400, "Unauthorized", true);
    }
    const cookiesOption = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    };
    res.cookie("accessToken", cookiesOption);
    res.cookie("refreshToken", cookiesOption);
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { refresh_token: "" }
    });
    res.status(200).json({
        success: true,
        error: false,
        message: "User signed out successfully",
    });
};
exports.SignOut = SignOut;
const GetUserDetails = async (req, res) => {
    try {
        const id = req.userId;
        if (!id) {
            return (0, errorHandler_1.errorHandler)(res, 400, "User ID is required", true);
        }
        ;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                mobile: true,
                avatar: true,
                role: true,
                refresh_token: true,
            }
        });
        if (!user) {
            return (0, errorHandler_1.errorHandler)(res, 404, "User not found", false);
        }
        ;
        res.status(200).json({
            success: true,
            error: false,
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: true,
            message: error.message || "Internal server error!"
        });
    }
};
exports.GetUserDetails = GetUserDetails;
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true, firstName: true, lastName: true, email: true, mobile: true, avatar: true,
                role: true, status: true, verify_email: true, last_login_date: true, createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({
            success: true,
            error: false,
            data: users
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: true,
            message: error.message || "Internal server error!"
        });
    }
};
exports.getAllUsers = getAllUsers;
const ASSIGNABLE_ROLES = ["CONSUMER", "USER", "TRADE", "RETAILER", "DISTRIBUTOR", "NDIS_COORDINATOR", "ADMIN"];
const updateUserByAdmin = async (req, res) => {
    try {
        const { id, status, role } = req.body;
        if (!id)
            return (0, errorHandler_1.errorHandler)(res, 400, "User ID is required", true);
        const target = await prisma_1.prisma.user.findUnique({ where: { id }, select: { role: true } });
        if (!target)
            return (0, errorHandler_1.errorHandler)(res, 404, "User not found", true);
        // The OWNER account is untouchable — no role/status change by anyone.
        if (target.role === "OWNER") {
            return (0, errorHandler_1.errorHandler)(res, 403, "The owner account cannot be modified", true);
        }
        // OWNER can never be granted through the API (DB-only, set once).
        if (role && !ASSIGNABLE_ROLES.includes(role)) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Invalid role", true);
        }
        const updatedData = {};
        if (status)
            updatedData.status = status;
        if (role)
            updatedData.role = role;
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id }, data: updatedData,
            select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true }
        });
        res.status(200).json({ success: true, error: false, message: "User updated successfully", data: updatedUser });
    }
    catch (error) {
        res.status(500).json({ success: false, error: true, message: error.message || "Internal server error!" });
    }
};
exports.updateUserByAdmin = updateUserByAdmin;
// upload images with cloudinary
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.userId;
        const image = req.file;
        if (!userId) {
            (0, errorHandler_1.errorHandler)(res, 404, "Unauthorized User", true);
        }
        ;
        const upload = await (0, cloudinary_1.uploadImageCloudinary)(image);
        if (!upload?.url) {
            (0, errorHandler_1.errorHandler)(res, 404, "Image uploading failed!", true);
        }
        const updateUser = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { avatar: upload?.url },
            select: { id: true, avatar: true }
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "The image uploaded successfully!", false, updateUser);
    }
    catch (error) {
        (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!");
    }
};
exports.uploadAvatar = uploadAvatar;
const updateUserDetails = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return (0, errorHandler_1.errorHandler)(res, 400, "User ID is required", true);
        }
        ;
        const { firstName, lastName, email, password, mobile, avatar, role } = req.body;
        let hashPassword = "";
        if (password) {
            const salt = await bcrypt_1.default.genSalt(10);
            hashPassword = await bcrypt_1.default.hash(password, salt);
        }
        ;
        const updatedData = {};
        if (firstName)
            updatedData.firstName = firstName;
        if (lastName)
            updatedData.lastName = lastName;
        if (email)
            updatedData.email = email;
        if (mobile)
            updatedData.mobile = mobile;
        if (password)
            updatedData.password = hashPassword;
        if (avatar)
            updatedData.avatar = avatar;
        // SECURITY: role is intentionally NOT updatable here — this is the
        // self-service profile endpoint, and honouring a role from the request
        // body would let any user promote themselves (e.g. to ADMIN/OWNER).
        // Role changes go through updateUserByAdmin only.
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: updatedData
        });
        res.status(200).json({
            success: true,
            error: false,
            message: "User updated successfully",
            data: updatedUser
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: true,
            message: error.message || "Internal server error!"
        });
    }
};
exports.updateUserDetails = updateUserDetails;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return (0, errorHandler_1.errorHandler)(res, 400, "User ID is required", false);
        }
        ;
        // The OWNER account can never be deleted.
        const target = await prisma_1.prisma.user.findUnique({ where: { id }, select: { role: true } });
        if (!target)
            return (0, errorHandler_1.errorHandler)(res, 404, "User not found", true);
        if (target.role === "OWNER") {
            return (0, errorHandler_1.errorHandler)(res, 403, "The owner account cannot be deleted", true);
        }
        await prisma_1.prisma.user.delete({ where: { id: id } });
        res.status(200).json({
            success: true,
            error: false,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: true,
            message: error.message || "Internal server error!"
        });
    }
};
exports.deleteUser = deleteUser;
