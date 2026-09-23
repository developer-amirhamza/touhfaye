"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentControllers_1 = require("../controllers/paymentControllers");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Guests and signed-in users can both start a Stripe checkout. optionalAuth
// attaches userId when logged in; guests are identified by their cart cookie
// and the email captured on the checkout form.
router.post("/create-checkout-session", auth_1.optionalAuth, paymentControllers_1.createCheckoutSession);
exports.default = router;
