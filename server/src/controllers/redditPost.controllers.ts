import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { errorHandler } from "../utils/errorHandler";

// Public: published posts, most recent first.
export const getAllRedditPosts = async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 6;
        const posts = await prisma.redditPost.findMany({
            where: { isPublished: true },
            orderBy: { postedAt: "desc" },
            take: limit,
        });
        return errorHandler(res, 200, "Reddit posts fetched", false, posts);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

// Admin: every post including drafts.
export const getAllRedditPostsAdmin = async (req: Request, res: Response) => {
    try {
        const posts = await prisma.redditPost.findMany({
            orderBy: { createdAt: "desc" },
        });
        return errorHandler(res, 200, "Reddit posts fetched", false, posts);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

export const createRedditPost = async (req: Request, res: Response) => {
    try {
        const { subreddit, title, author, flair, upvotes, comments, url, postedAt, isPublished } = req.body;
        if (!subreddit || !title || !author || !flair) {
            return errorHandler(res, 400, "Please provide the required fields", true);
        }
        const post = await prisma.redditPost.create({
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
        return errorHandler(res, 200, "Reddit post created", false, post);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

export const updateRedditPost = async (req: Request, res: Response) => {
    try {
        const { id, subreddit, title, author, flair, upvotes, comments, url, postedAt, isPublished } = req.body;
        const existing = await prisma.redditPost.findUnique({ where: { id } });
        if (!existing) return errorHandler(res, 404, "Reddit post not found");

        const post = await prisma.redditPost.update({
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
        return errorHandler(res, 200, "Reddit post updated", false, post);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

export const deleteRedditPost = async (req: Request, res: Response) => {
    try {
        const { id } = req.body;
        if (!id) return errorHandler(res, 400, "Reddit post id is required");
        await prisma.redditPost.delete({ where: { id } });
        return errorHandler(res, 200, "Reddit post deleted", false);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};
