import { Router } from "express";
import {
  previewQuote,
  createQuote,
  getMyQuotes,
  getQuote,
  duplicateQuote,
  emailQuote,
  convertQuoteToOrder,
} from "../controllers/quote.controllers";
import { auth } from "../middlewares/auth";
import { requireRole, ROLES } from "../middlewares/role";

const router = Router();

// All quote routes are restricted to NDIS coordinators (and admins).
const ndis = requireRole(ROLES.NDIS_COORDINATOR, ROLES.ADMIN);

router.post("/preview", auth, ndis, previewQuote);
router.post("/", auth, ndis, createQuote);
router.get("/", auth, ndis, getMyQuotes);
router.get("/:id", auth, ndis, getQuote);
router.post("/duplicate", auth, ndis, duplicateQuote);
router.post("/email", auth, ndis, emailQuote);
router.post("/convert", auth, ndis, convertQuoteToOrder);

export default router;