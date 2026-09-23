"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controllers_1 = require("../controllers/category.controllers");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const router = (0, express_1.Router)();
// Public
router.get('/', category_controllers_1.getAllCategories);
router.post('/single-category', category_controllers_1.getCategoryBySlug);
// Admin only
router.post("/create", auth_1.auth, admin_1.admin, category_controllers_1.createCategory);
router.put("/update", auth_1.auth, admin_1.admin, category_controllers_1.updateCategory);
router.delete("/delete", auth_1.auth, admin_1.admin, category_controllers_1.deleteCategory);
exports.default = router;
