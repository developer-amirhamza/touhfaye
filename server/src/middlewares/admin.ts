import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

interface AuthRequest extends Request {
  userId?: string;
}

// Must be used AFTER the `auth` middleware, which sets req.userId.
export const admin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: true,
        message: "Authentication required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // OWNER is the site owner and has full admin access.
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
      return res.status(403).json({
        success: false,
        error: true,
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Internal server error!",
    });
  }
};
