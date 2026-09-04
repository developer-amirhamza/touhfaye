import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import dotenv from "dotenv";
dotenv.config();

const generateAccessToken = async (userId:string) => {
    const token = jwt.sign(
        { id: userId },
        process.env.SECRET_KEY_ACCESS_TOKEN!,
        { expiresIn: "1d" }
    );
    return token;
}

export default generateAccessToken