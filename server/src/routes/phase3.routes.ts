import { Router } from "express";
import {
  listDeliverySites,
  upsertDeliverySite,
  deleteDeliverySite,
  listNegotiatedPrices,
  upsertNegotiatedPrice,
  deleteNegotiatedPrice,
  getReport,
} from "../controllers/phase3.controllers";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";
import { requireRole, ROLES, TRADE_FAMILY } from "../middlewares/role";

const router = Router();
const trade = requireRole(...TRADE_FAMILY, ROLES.ADMIN);

// Multi-site delivery — trade accounts manage their own sites.
router.get("/delivery-sites", auth, trade, listDeliverySites);
router.put("/delivery-sites", auth, trade, upsertDeliverySite);
router.delete("/delivery-sites", auth, trade, deleteDeliverySite);

// Negotiated pricing + deeper report — admin only.
router.get("/negotiated-prices", auth, admin, listNegotiatedPrices);
router.put("/negotiated-prices", auth, admin, upsertNegotiatedPrice);
router.delete("/negotiated-prices", auth, admin, deleteNegotiatedPrice);
router.get("/report", auth, admin, getReport);

export default router;