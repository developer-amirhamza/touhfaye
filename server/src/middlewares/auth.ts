import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config();


interface AuthRequest extends Request {
  userId?: string;
}
export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken || req?.headers?.authorization?.split(" ")[1];

    // Validate token type
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing or invalid"
      });
    }

    // Verify secret exists
    const secret = process.env.SECRET_KEY_ACCESS_TOKEN;


    // Verify token
    const decoded = await jwt.verify(token,process.env.SECRET_KEY_ACCESS_TOKEN as string) as {id:string};
    req.userId = decoded.id;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message === 'jwt must be a string'
        ? 'Invalid token format'
        : 'Invalid or expired token'
    });
  }
};

// Optional auth: attaches req.userId when a valid token is present, but lets
// the request through as a GUEST when the token is missing/invalid/expired.
// Use on routes that must work for both signed-in users and guests (cart,
// checkout, place-order) — the controllers already handle a missing userId
// by falling back to the guest cart token / a supplied email.
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req?.headers?.authorization?.split(" ")[1];
    if (token && typeof token === "string" && token.trim() !== "") {
      try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN as string) as { id: string };
        req.userId = decoded.id;
      } catch {
        // Invalid / expired token → treat as a guest, don't block the request.
      }
    }
  } catch {
    // Never fail the request from optional auth.
  }
  next();
};