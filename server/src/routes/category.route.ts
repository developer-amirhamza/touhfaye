import { Router } from "express";
import { createCategory, deleteCategory, getAllCategories, getCategoryBySlug, updateCategory } from "../controllers/category.controllers";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";

const router = Router()

// Public
router.get('/', getAllCategories);
router.post('/single-category', getCategoryBySlug);

// Admin only
router.post("/create", auth, admin, createCategory);
router.put("/update", auth, admin, updateCategory);
router.delete("/delete", auth, admin, deleteCategory);

export default router;