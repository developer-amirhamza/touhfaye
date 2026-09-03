import { Request, Response } from 'express';
import { errorHandler } from '../utils/errorHandler';
import { prisma } from '../lib/prisma';


interface AuthRequest extends Request {
  userId?: string;
}

// ---------- GET all reviews (admin) ----------
export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.reviews.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName:true, avatar: true, email: true } },
        product: { select: { id: true, title: true, images: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return errorHandler(res, 200, "All reviews retrieved", false, {
      reviews,
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error");
  }
};

// ---------- GET reviews for a product (public) ----------
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return errorHandler(res, 400, "Product ID is required");
    }

    const reviews = await prisma.reviews.findMany({
      where: { productId: productId as string },
      include: {
        user: {
          select: { id: true, firstName: true,lastName:true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return errorHandler(res, 200, "Reviews retrieved", false, {
      reviews,
      averageRating,
      totalReviews: reviews.length,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error");
  }
};

// ---------- ADD review (authenticated users only) ----------
export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return errorHandler(res, 401, "Unauthorized – please login");
    }

    const { productId, rating, comment } = req.body;
    if (!productId || !rating) {
      return errorHandler(res, 400, "Product ID and rating are required");
    }
    if (rating < 1 || rating > 5) {
      return errorHandler(res, 400, "Rating must be between 1 and 5");
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });
    if (!product) {
      return errorHandler(res, 404, "Product not found");
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.reviews.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existingReview) {
      return errorHandler(res, 409, "You have already reviewed this product");
    }

    const review = await prisma.reviews.create({
      data: {
        rating,
        comment: comment || null,
        userId,
        productId,
      },
      include: {
        user: {
          select: { id: true, firstName: true,lastName:true, avatar: true },
        },
      },
    });

    return errorHandler(res, 201, "Review added successfully", false, review);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error");
  }
};

// ---------- UPDATE review (owner only or admin) ----------
export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { reviewId } = req.body;
    const { rating, comment } = req.body;

    if (!reviewId) {
      return errorHandler(res, 400, "Review ID required");
    }

    const review = await prisma.reviews.findUnique({
      where: { id: reviewId as string },
      include: { product: true },
    });
    if (!review) {
      return errorHandler(res, 404, "Review not found");
    }

    // // Check ownership or admin
    // const user = await prisma.user.findUnique({ where: { id: userId } });
    // const isAdmin = user?.role === 'USER';
    // if (review.userId !== userId && !isAdmin) {
    //   return errorHandler(res, 403, "You can only update your own reviews");
    // }

    const updateData: any = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return errorHandler(res, 400, "Rating must be between 1 and 5");
      }
      updateData.rating = rating;
    }
    if (comment !== undefined) updateData.comment = comment;

    const updated = await prisma.reviews.update({
      where: { id: reviewId as string },
      data: updateData,
      include: {
        user: { select: { id: true, firstName: true,lastName:true, avatar: true } },
      },
    });

    return errorHandler(res, 200, "Review updated", false, updated);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error");
  }
};

// ---------- DELETE review (owner only or admin) ----------
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { reviewId } = req.body;

    const review = await prisma.reviews.findUnique({ where: { id: reviewId as string} });
    if (!review) {
      return errorHandler(res, 404, "Review not found");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'ADMIN';
    if (review.userId !== userId && !isAdmin) {
      return errorHandler(res, 403, "You can only delete your own reviews");
    }

    await prisma.reviews.delete({ where: { id: reviewId as string } });
    return errorHandler(res, 200, "Review deleted successfully", false, null);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error");
  }
};