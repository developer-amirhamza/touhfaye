import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Canonical role values used across the platform.
// OWNER is the site owner: full admin access, but the account itself is
// untouchable — no one (including other admins) can change its role/status
// or delete it, and OWNER can never be granted through the API.
export const ROLES = {
  CONSUMER: "CONSUMER",
  // Legacy generic wholesale role — existing accounts keep working exactly
  // as before. New business signups now pick RETAILER or DISTRIBUTOR
  // instead, but all three share the same wholesale catalogue/order/pricing
  // mechanics (see TRADE_FAMILY).
  TRADE: "TRADE",
  RETAILER: "RETAILER",
  DISTRIBUTOR: "DISTRIBUTOR",
  NDIS_COORDINATOR: "NDIS_COORDINATOR",
  ADMIN: "ADMIN",
  OWNER: "OWNER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Every role that gets the wholesale catalogue, order history, standing
// orders and delivery-site routes.
export const TRADE_FAMILY: string[] = [ROLES.TRADE, ROLES.RETAILER, ROLES.DISTRIBUTOR];

// The roles a product's admin form exposes a dedicated price field for —
// each becomes a PriceOverride row when set, resolved via resolveUnitPrice.
export const PRICE_OVERRIDE_ROLES: string[] = [
  ROLES.TRADE,
  ROLES.RETAILER,
  ROLES.DISTRIBUTOR,
  ROLES.NDIS_COORDINATOR,
  ROLES.CONSUMER,
];

// Normalise legacy values: "USER" was the old consumer role.
export const normaliseRole = (role?: string | null): string =>
  role === "USER" || !role ? ROLES.CONSUMER : role;

// Must be used AFTER `auth`, which sets req.userId.
// Allows the request through only if the user's role is in `allowed`.
export const requireRole =
  (...allowed: string[]) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, error: true, message: "Authentication required" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      const role = normaliseRole(user?.role);
      // OWNER has every permission ADMIN has (and passes any role gate that
      // admits ADMIN), on top of any gate that names OWNER explicitly.
      const permitted =
        allowed.includes(role) || (role === ROLES.OWNER && allowed.includes(ROLES.ADMIN));
      if (!user || !permitted) {
        return res.status(403).json({
          success: false,
          error: true,
          message: "Access denied. Insufficient privileges.",
        });
      }

      req.userRole = role;
      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: true,
        message: error.message || "Internal server error!",
      });
    }
  };
