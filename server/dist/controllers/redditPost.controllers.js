"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRedditPost = exports.updateRedditPost = exports.createRedditPost = exports.getAllRedditPostsAdmin = exports.getAllRedditPosts = void 0;
const prisma_1 = require("../lib/prisma");
const errorHandler_1 = require("../utils/errorHandler");
// Public: published posts, most recent first.
const getAllRedditPosts = async (req, res) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 6;
        const posts = await prisma_1.prisma.redditPost.findMany({
            where: { isPublished: true },
            orderBy: { postedAt: "desc" },
            take: limit,
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "Reddit posts fetched", false, posts);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.getAllRedditPosts = getAllRedditPosts;
// Admin: every post including drafts.
const getAllRedditPostsAdmin = async (req, res) => {
    try {
        const posts = await prisma_1.prisma.redditPost.findMany({
            orderBy: { createdAt: "desc" },
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "Reddit posts fetched", false, posts);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.getAllRedditPostsAdmin = getAllRedditPostsAdmin;
const createRedditPost = async (req, res) => {
    try {
        const { subreddit, title, author, flair, upvotes, comments, url, postedAt, isPublished } = req.body;
        if (!subreddit || !title || !author || !flair) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Please provide the required fields", true);
        }
        const post = await prisma_1.prisma.redditPost.create({
            data: {
                subreddit,
                title,
                author,
                flair,
                url,
                upvotes: upvotes != null && upvotes !== "" ? Number(upvotes) : 0,
                comments: comments != null && comments !== "" ? Number(comments) : 0,
                postedAt: postedAt ? new Date(postedAt) : undefined,
                isPublished: isPublished ?? true,
            },
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "Reddit post created", false, post);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.createRedditPost = createRedditPost;
const updateRedditPost = async (req, res) => {
    try {
        const { id, subreddit, title, author, flair, upvotes, comments, url, postedAt, isPublished } = req.body;
        const existing = await prisma_1.prisma.redditPost.findUnique({ where: { id } });
        if (!existing)
            return (0, errorHandler_1.errorHandler)(res, 404, "Reddit post not found");
        const post = await prisma_1.prisma.redditPost.update({
            where: { id },
            data: {
                subreddit,
                title,
                author,
                flair,
                url,
                upvotes: upvotes !== undefined ? (upvotes !== "" ? Number(upvotes) : 0) : undefined,
                comments: comments !== undefined ? (comments !== "" ? Number(comments) : 0) : undefined,
                postedAt: postedAt !== undefined ? (postedAt ? new Date(postedAt) : undefined) : undefined,
                isPublished,
            },
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "Reddit post updated", false, post);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.updateRedditPost = updateRedditPost;
const deleteRedditPost = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id)
            return (0, errorHandler_1.errorHandler)(res, 400, "Reddit post id is required");
        await prisma_1.prisma.redditPost.delete({ where: { id } });
        return (0, errorHandler_1.errorHandler)(res, 200, "Reddit post deleted", false);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.deleteRedditPost = deleteRedditPost;
