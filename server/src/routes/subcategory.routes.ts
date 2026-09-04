import { Router } from "express";
import { createSubcategory, deleteSubcategory, getSubcategoriesByCategory, getSubcategoryBySlug, updateSubcategory } from "../controllers/subcategory.controllers";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";

const router = Router();

// Public
router.post('/category/subcategories-by-categories', getSubcategoriesByCategory);
router.get('/subcategory-by-slug', getSubcategoryBySlug);

// Admin only
router.post('/create', auth, admin, createSubcategory);
router.put('/update', auth, admin, updateSubcategory);
router.delete('/delete', auth, admin, deleteSubcategory);

export default router;