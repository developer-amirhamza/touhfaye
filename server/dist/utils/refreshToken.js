"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const generateRefreshToken = async (userId) => {
    const token = jsonwebtoken_1.default.sign({ id: userId }, process.env.SECRET_KEY_REFRESH_TOKEN, { expiresIn: "7d" });
    return token;
};
exports.default = generateRefreshToken;
