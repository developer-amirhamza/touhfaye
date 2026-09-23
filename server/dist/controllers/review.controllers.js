"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.updateReview = exports.addReview = exports.getProductReviews = exports.getAllReviews = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const prisma_1 = require("../lib/prisma");
// ---------- GET all reviews (admin) ----------
const getAllReviews = async (req, res) => {
    try {
        const reviews = await prisma_1.prisma.reviews.findMany({
            include: {
                user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
                product: { select: { id: true, title: true, images: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        return (0, errorHandler_1.errorHandler)(res, 200, "All reviews retrieved", false, {
            reviews,
            totalReviews: reviews.length,
            averageRating: Math.round(averageRating * 10) / 10,
        });
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error");
    }
};
exports.getAllReviews = getAllReviews;
// ---------- GET reviews for a product (public) ----------
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Product ID is required");
        }
        const reviews = await prisma_1.prisma.reviews.findMany({
            where: { productId: productId },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Calculate average rating
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        return (0, errorHandler_1.errorHandler)(res, 200, "Reviews retrieved", false, {
            reviews,
            averageRating,
            totalReviews: reviews.length,
        });
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error");
    }
};
exports.getProductReviews = getProductReviews;
// ---------- ADD review (authenticated users only) ----------
const addReview = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return (0, errorHandler_1.errorHandler)(res, 401, "Unauthorized – please login");
        }
        const { productId, rating, comment } = req.body;
        if (!productId || !rating) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Product ID and rating are required");
        }
        if (rating < 1 || rating > 5) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Rating must be between 1 and 5");
        }
        // Check if product exists
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: productId, isActive: true },
        });
        if (!product) {
            return (0, errorHandler_1.errorHandler)(res, 404, "Product not found");
        }
        // Check if user already reviewed this product
        const existingReview = await prisma_1.prisma.reviews.findUnique({
            where: { userId_productId: { userId, productId } },
        });
        if (existingReview) {
            return (0, errorHandler_1.errorHandler)(res, 409, "You have already reviewed this product");
        }
        const review = await prisma_1.prisma.reviews.create({
            data: {
                rating,
                comment: comment || null,
                userId,
                productId,
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                },
            },
        });
        return (0, errorHandler_1.errorHandler)(res, 201, "Review added successfully", false, review);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error");
    }
};
exports.addReview = addReview;
// ---------- UPDATE review (owner only or admin) ----------
const updateReview = async (req, res) => {
    try {
        const userId = req.userId;
        const { reviewId } = req.body;
        const { rating, comment } = req.body;
        if (!reviewId) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Review ID required");
        }
        const review = await prisma_1.prisma.reviews.findUnique({
            where: { id: reviewId },
            include: { product: true },
        });
        if (!review) {
            return (0, errorHandler_1.errorHandler)(res, 404, "Review not found");
        }
        // // Check ownership or admin
        // const user = await prisma.user.findUnique({ where: { id: userId } });
        // const isAdmin = user?.role === 'USER';
        // if (review.userId !== userId && !isAdmin) {
        //   return errorHandler(res, 403, "You can only update your own reviews");
        // }
        const updateData = {};
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return (0, errorHandler_1.errorHandler)(res, 400, "Rating must be between 1 and 5");
            }
            updateData.rating = rating;
        }
        if (comment !== undefined)
            updateData.comment = comment;
        const updated = await prisma_1.prisma.reviews.update({
            where: { id: reviewId },
            data: updateData,
            include: {
                user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            },
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "Review updated", false, updated);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error");
    }
};
exports.updateReview = updateReview;
// ---------- DELETE review (owner only or admin) ----------
const deleteReview = async (req, res) => {
    try {
        const userId = req.userId;
        const { reviewId } = req.body;
        const review = await prisma_1.prisma.reviews.findUnique({ where: { id: reviewId } });
        if (!review) {
            return (0, errorHandler_1.errorHandler)(res, 404, "Review not found");
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        const isAdmin = user?.role === 'ADMIN';
        if (review.userId !== userId && !isAdmin) {
            return (0, errorHandler_1.errorHandler)(res, 403, "You can only delete your own reviews");
        }
        await prisma_1.prisma.reviews.delete({ where: { id: reviewId } });
        return (0, errorHandler_1.errorHandler)(res, 200, "Review deleted successfully", false, null);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error");
    }
};
exports.deleteReview = deleteReview;
