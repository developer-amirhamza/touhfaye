import { Router } from 'express';
import { createBlog, deleteBlog, getAllBlogs, getBlogById, getBlogBySlug, updateBlog } from '../controllers/blog.controllers';
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";

const router = Router();

// Public
router.get('/all', getAllBlogs);
router.post('/by-slug', getBlogBySlug);
router.post('/by-id', getBlogById);

// Admin only
router.post('/create', auth, admin, createBlog);
router.put('/update', auth, admin, updateBlog);
router.delete('/delete', auth, admin, deleteBlog);

export default router;