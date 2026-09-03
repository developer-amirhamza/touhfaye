import { Router } from "express";
import { getEmailStatus, sendTestEmail } from "../controllers/health.controllers";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";

const router = Router();

// Admin-only email diagnostics.
router.get("/email",  getEmailStatus);
router.post("/email",  sendTestEmail);

export default router;
