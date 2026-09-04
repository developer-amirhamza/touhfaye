import { Router } from "express";
import {
  getPricingSettings,
  updatePricingSettings,
  listPricingTiers,
  upsertPricingTier,
  deletePricingTier,
  listPriceOverrides,
  upsertPriceOverride,
  deletePriceOverride,
  quoteUnitPrice,
} from "../controllers/pricing.controllers";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";

const router = Router();

// Read settings + price quote (any logged-in user; portals need these)
router.get("/settings", getPricingSettings);
router.get("/quote", auth, quoteUnitPrice);
router.get("/tiers", listPricingTiers);

// Admin: manage pricing rules
router.put("/settings", auth, admin, updatePricingSettings);
router.put("/tiers", auth, admin, upsertPricingTier);
router.delete("/tiers", auth, admin, deletePricingTier);
router.get("/overrides", auth, admin, listPriceOverrides);
router.put("/overrides", auth, admin, upsertPriceOverride);
router.delete("/overrides", auth, admin, deletePriceOverride);

export default router;