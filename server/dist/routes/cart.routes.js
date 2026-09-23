"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controllers_1 = require("../controllers/cart.controllers");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Cart works for BOTH guests and signed-in users — optionalAuth attaches the
// userId when logged in, otherwise the controller uses the guest cart cookie.
router.get("/get-cart", auth_1.optionalAuth, cart_controllers_1.getCart);
router.post("/add-cart", auth_1.optionalAuth, cart_controllers_1.addToCart);
router.put("/update-cart", auth_1.optionalAuth, cart_controllers_1.updateCartItem);
router.delete("/delete-cart", auth_1.optionalAuth, cart_controllers_1.deleteCartItem);
// Merge only makes sense once signed in.
router.post('/merge-cart', auth_1.auth, cart_controllers_1.mergeCartAfterLogin);
exports.default = router;
