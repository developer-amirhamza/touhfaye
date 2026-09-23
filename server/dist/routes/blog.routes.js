"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const blog_controllers_1 = require("../controllers/blog.controllers");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const router = (0, express_1.Router)();
// Public
router.get('/all', blog_controllers_1.getAllBlogs);
router.post('/by-slug', blog_controllers_1.getBlogBySlug);
router.post('/by-id', blog_controllers_1.getBlogById);
// Admin only
router.post('/create', auth_1.auth, admin_1.admin, blog_controllers_1.createBlog);
router.put('/update', auth_1.auth, admin_1.admin, blog_controllers_1.updateBlog);
router.delete('/delete', auth_1.auth, admin_1.admin, blog_controllers_1.deleteBlog);
exports.default = router;
