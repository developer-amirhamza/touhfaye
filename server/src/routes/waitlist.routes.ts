import { Router } from "express";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";
import { joinWaitlist, listWaitlist } from "../controllers/waitlist.controllers";

const router = Router();

// Public — anyone can join the waitlist from the marketing popup.
router.post("/", joinWaitlist);

// Admin only — view all leads (client-side Excel export reads this).
router.get("/", auth, admin, listWaitlist);

export default router;
