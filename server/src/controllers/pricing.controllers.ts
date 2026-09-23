import { Response, Request } from "express";
import { errorHandler } from "../utils/errorHandler";
import { prisma } from "../lib/prisma";
import { getSettings, setSetting, SETTING_DEFAULTS, resolveUnitPrice } from "../services/pricing";

// ── Settings ──────────────────────────────────────────────────────────────
// Public-ish read so the storefront/portals can show GST + delivery rules.
export const getPricingSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await getSettings();
    return res.status(200).json({ success: true, error: false, data: settings });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Admin: update one or more settings at once.
export const updatePricingSettings = async (req: Request, res: Response) => {
  try {
    const updates = req.body ?? {};
    const allowed = Object.keys(SETTING_DEFAULTS);
    const keys = Object.keys(updates).filter((k) => allowed.includes(k));
    if (keys.length === 0) {
      return errorHandler(res, 400, "No valid settings provided", true);
    }
    await Promise.all(keys.map((k) => setSetting(k, updates[k])));
    const settings = await getSettings();
    return res.status(200).json({
      success: true,
      error: false,
      message: "Pricing settings updated",
      data: settings,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// ── Volume tiers (B2B) ──────────────────────────────────────────────────────
export const listPricingTiers = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;
    const tiers = await prisma.pricingTier.findMany({
      where: productId ? { productId: String(productId) } : undefined,
      orderBy: [{ productId: "asc" }, { minQuantity: "asc" }],
    });
    return res.status(200).json({ success: true, error: false, data: tiers });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

export const upsertPricingTier = async (req: Request, res: Response) => {
  try {
    const { id, productId, role, minQuantity, pricePerUnit, label } = req.body;
    if (minQuantity == null || pricePerUnit == null) {
      return errorHandler(res, 400, "minQuantity and pricePerUnit are required", true);
    }
    const data = {
      productId: productId ?? null,
      role: role ?? "TRADE",
      minQuantity: Number(minQuantity),
      pricePerUnit: Number(pricePerUnit),
      label: label ?? null,
    };
    const tier = id
      ? await prisma.pricingTier.update({ where: { id }, data })
      : await prisma.pricingTier.create({ data });
    return res.status(200).json({
      success: true,
      error: false,
      message: id ? "Tier updated" : "Tier created",
      data: tier,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

export const deletePricingTier = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return errorHandler(res, 400, "id is required", true);
    await prisma.pricingTier.delete({ where: { id } });
    return res.status(200).json({ success: true, error: false, message: "Tier deleted" });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// ── Per-product per-role price overrides (e.g. NDIS price) ────────────────────
export const listPriceOverrides = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;
    const overrides = await prisma.priceOverride.findMany({
      where: productId ? { productId: String(productId) } : undefined,
      orderBy: [{ productId: "asc" }, { role: "asc" }],
    });
    return res.status(200).json({ success: true, error: false, data: overrides });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

export const upsertPriceOverride = async (req: Request, res: Response) => {
  try {
    const { productId, role, price } = req.body;
    if (!productId || !role || price == null) {
      return errorHandler(res, 400, "productId, role and price are required", true);
    }
    const override = await prisma.priceOverride.upsert({
      where: { productId_role: { productId, role } },
      update: { price: Number(price) },
      create: { productId, role, price: Number(price) },
    });
    return res.status(200).json({
      success: true,
      error: false,
      message: "Price override saved",
      data: override,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

export const deletePriceOverride = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return errorHandler(res, 400, "id is required", true);
    await prisma.priceOverride.delete({ where: { id } });
    return res.status(200).json({ success: true, error: false, message: "Override deleted" });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// ── Price quote helper ────────────────────────────────────────────────────────
// Returns the resolved unit price for a product given role + quantity.
// Used by portals to preview the price a buyer will actually pay.
export const quoteUnitPrice = async (req: Request, res: Response) => {
  try {
    const { productId, role, quantity } = req.query;
    if (!productId) return errorHandler(res, 400, "productId is required", true);
    const unitPrice = await resolveUnitPrice({
      productId: String(productId),
      role: role ? String(role) : undefined,
      quantity: quantity ? Number(quantity) : 1,
    });
    return res.status(200).json({ success: true, error: false, data: { unitPrice } });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};