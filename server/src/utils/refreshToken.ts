import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import dotenv from "dotenv";
dotenv.config();

const generateRefreshToken = async (userId:string) => {
    const token = jwt.sign(
        { id: userId },
        process.env.SECRET_KEY_REFRESH_TOKEN!,
        { expiresIn: "7d" }
    );
    return token;
}

export default generateRefreshToken