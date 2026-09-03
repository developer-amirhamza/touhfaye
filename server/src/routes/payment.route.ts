import { Router } from "express";
import { createCheckoutSession } from "../controllers/paymentControllers";
import { optionalAuth } from "../middlewares/auth";

const router = Router();

// Guests and signed-in users can both start a Stripe checkout. optionalAuth
// attaches userId when logged in; guests are identified by their cart cookie
// and the email captured on the checkout form.
router.post("/create-checkout-session", optionalAuth, createCheckoutSession);

export default router;