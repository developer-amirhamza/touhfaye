import { Router } from "express";
import {
  getTradeCatalogue,
  placeTradeOrder,
  quickReorder,
  listStandingOrders,
  upsertStandingOrder,
  getMyCreditStatus,
} from "../controllers/trade.controllers";
import { auth } from "../middlewares/auth";
import { requireRole, ROLES, TRADE_FAMILY } from "../middlewares/role";

const router = Router();

// All trade routes are gated to approved wholesale accounts (Trade,
// Retailer, Distributor) and admins.
const trade = requireRole(...TRADE_FAMILY, ROLES.ADMIN);

router.get("/catalogue", auth, trade, getTradeCatalogue);
router.post("/order", auth, trade, placeTradeOrder);
router.post("/reorder", auth, trade, quickReorder);

router.get("/standing-orders", auth, trade, listStandingOrders);
router.put("/standing-orders", auth, trade, upsertStandingOrder);

router.get("/credit", auth, trade, getMyCreditStatus);

export default router;