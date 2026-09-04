import { Router } from "express";
import { createProduct, deleteProduct, getAllProductDetails, getProductDetails, getProductsByCategory, getProductsBySubcategory, searchProducts, updateProduct } from "../controllers/products.controllers";
import { auth, optionalAuth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";

const router = Router();

// Public, but role-aware when signed in — optionalAuth attaches req.userId
// when a valid token is present so these can resolve each product's price
// for the viewer's role, and fall back to the main price for guests.
router.post("/get-details", optionalAuth, getProductDetails);
router.get("/search", optionalAuth, searchProducts);
router.get("/all", optionalAuth, getAllProductDetails);
router.post("/by-category", optionalAuth, getProductsByCategory);
router.post("/by-subcategory", optionalAuth, getProductsBySubcategory);

// Admin only
router.post("/create", auth, admin, createProduct);
router.put("/update", auth, admin, updateProduct);
router.delete("/delete", auth, admin, deleteProduct);

export default router;