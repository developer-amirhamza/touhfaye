import { Router } from "express";
import { auth } from "../middlewares/auth";
import { admin } from "../middlewares/admin";
import {
    createRedditPost,
    deleteRedditPost,
    getAllRedditPosts,
    getAllRedditPostsAdmin,
    updateRedditPost,
} from "../controllers/redditPost.controllers";

const router = Router();

// Public
router.get("/all", getAllRedditPosts);

// Admin only
router.get("/admin/all", auth, admin, getAllRedditPostsAdmin);
router.post("/create", auth, admin, createRedditPost);
router.put("/update", auth, admin, updateRedditPost);
router.delete("/delete", auth, admin, deleteRedditPost);

export default router;
