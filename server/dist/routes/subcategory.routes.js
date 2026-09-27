"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subcategory_controllers_1 = require("../controllers/subcategory.controllers");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const router = (0, express_1.Router)();
// Public
router.post('/category/subcategories-by-categories', subcategory_controllers_1.getSubcategoriesByCategory);
router.get('/subcategory-by-slug', subcategory_controllers_1.getSubcategoryBySlug);
// Admin only
router.post('/create', auth_1.auth, admin_1.admin, subcategory_controllers_1.createSubcategory);
router.put('/update', auth_1.auth, admin_1.admin, subcategory_controllers_1.updateSubcategory);
router.delete('/delete', auth_1.auth, admin_1.admin, subcategory_controllers_1.deleteSubcategory);
exports.default = router;
