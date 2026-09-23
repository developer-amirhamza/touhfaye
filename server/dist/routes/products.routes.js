"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const products_controllers_1 = require("../controllers/products.controllers");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const router = (0, express_1.Router)();
// Public, but role-aware when signed in — optionalAuth attaches req.userId
// when a valid token is present so these can resolve each product's price
// for the viewer's role, and fall back to the main price for guests.
router.post("/get-details", auth_1.optionalAuth, products_controllers_1.getProductDetails);
router.get("/search", auth_1.optionalAuth, products_controllers_1.searchProducts);
router.get("/all", auth_1.optionalAuth, products_controllers_1.getAllProductDetails);
router.post("/by-category", auth_1.optionalAuth, products_controllers_1.getProductsByCategory);
router.post("/by-subcategory", auth_1.optionalAuth, products_controllers_1.getProductsBySubcategory);
// Admin only
router.post("/create", auth_1.auth, admin_1.admin, products_controllers_1.createProduct);
router.put("/update", auth_1.auth, admin_1.admin, products_controllers_1.updateProduct);
router.delete("/delete", auth_1.auth, admin_1.admin, products_controllers_1.deleteProduct);
exports.default = router;
