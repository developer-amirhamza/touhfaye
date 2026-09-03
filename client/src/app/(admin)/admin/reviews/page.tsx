"use client";
import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import toast from "react-hot-toast";
import { FaStar, FaRegStar, FaTrash, FaSearch } from "react-icons/fa";

interface ReviewUser {
    id: string;
    firstName: string;
    lastName?:string;
    avatar?: string;
    email?: string;
}

interface ReviewProduct {
    id: string;
    title: string;
    images?: string[];
}

interface Review {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user: ReviewUser;
    product: ReviewProduct;
}

const RatingStars = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((i) =>
            rating >= i ? <FaStar key={i} className="text-xs" /> : <FaRegStar key={i} className="text-xs" />
        )}
    </div>
);

const AdminReviewsPage = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filterRating, setFilterRating] = useState<number | "">("");
    const [totalReviews, setTotalReviews] = useState(0);
    const [averageRating, setAverageRating] = useState(0);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await Axios({ ...SummeryApi.getAllReviews });
            if (response.data?.success) {
                setReviews(response.data?.data?.reviews || []);
                setTotalReviews(response.data?.data?.totalReviews || 0);
                setAverageRating(response.data?.data?.averageRating || 0);
            } else {
                toast.error(response.data?.message || "Failed to fetch reviews");
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (reviewId: string) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;
        try {
            setDeleteLoading(reviewId);
            const response = await Axios({
                ...SummeryApi.deleteReview,
                data: { reviewId },
            });
            if (response.data?.success) {
                toast.success("Review deleted successfully");
                setReviews((prev) => prev.filter((r) => r.id !== reviewId));
                setTotalReviews((prev) => prev - 1);
            } else {
                toast.error(response.data?.message || "Failed to delete review");
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setDeleteLoading(null);
        }
    };

    const filtered = reviews.filter((r) => {
        const matchesSearch =
            search === "" ||
            r.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
            r.product?.title?.toLowerCase().includes(search.toLowerCase()) ||
            r.comment?.toLowerCase().includes(search.toLowerCase());
        const matchesRating = filterRating === "" || r.rating === Number(filterRating);
        return matchesSearch && matchesRating;
    });

    const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => r.rating === star).length,
    }));

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Reviews</h1>
                <button
                    onClick={fetchReviews}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition"
                >
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-500 text-sm font-medium">Total Reviews</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{totalReviews}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-500 text-sm font-medium">Average Rating</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-3xl font-bold text-yellow-500">{averageRating.toFixed(1)}</p>
                        <RatingStars rating={Math.round(averageRating)} />
                    </div>
                </div>
                {ratingCounts.slice(0, 2).map(({ star, count }) => (
                    <div key={star} className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-gray-500 text-sm font-medium">{star}-Star Reviews</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-1">{count}</p>
                    </div>
                ))}
            </div>

            {/* Rating breakdown */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Rating Breakdown</h2>
                <div className="flex flex-col gap-2">
                    {ratingCounts.map(({ star, count }) => {
                        const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                        return (
                            <div key={star} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-16 shrink-0">
                                    <span className="text-sm font-medium text-gray-600">{star}</span>
                                    <FaStar className="text-amber-400 text-xs" />
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-amber-400 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="text-sm text-gray-500 w-14 text-right">{count} ({pct}%)</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        type="text"
                        placeholder="Search by user, product or comment..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value === "" ? "" : Number(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-44"
                >
                    <option value="">All Ratings</option>
                    {[5, 4, 3, 2, 1].map((s) => (
                        <option key={s} value={s}>{s} Stars</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                    No reviews found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((review, index) => (
                                <tr key={review.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>

                                    {/* User */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={review.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.firstName || "U")}&background=3b82f6&color=fff`}
                                                alt={review.user?.firstName}
                                                className="w-8 h-8 rounded-full object-cover shrink-0"
                                            />
                                            <div>
                                                <p className="text-sm font-semibold flex gap-2 text-gray-800">{review.user?.firstName} {review.user?.lastName} </p>
                                                {review.user?.email && (
                                                    <p className="text-xs text-gray-500">{review.user.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Product */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {review.product?.images?.[0] && (
                                                <img
                                                    src={review.product.images[0]}
                                                    alt={review.product.title}
                                                    className="w-10 h-10 rounded object-cover shrink-0"
                                                />
                                            )}
                                            <span className="text-sm font-medium text-gray-800 line-clamp-2 max-w-40">
                                                {review.product?.title}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Rating */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <RatingStars rating={review.rating} />
                                            <span className="text-xs text-gray-500">{review.rating}/5</span>
                                        </div>
                                    </td>

                                    {/* Comment */}
                                    <td className="px-6 py-4 max-w-50">
                                        {review.comment ? (
                                            <p className="text-sm text-gray-700 line-clamp-2">{review.comment}</p>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No comment</span>
                                        )}
                                    </td>

                                    {/* Date */}
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            disabled={deleteLoading === review.id}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                                deleteLoading === review.id
                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    : "bg-red-50 text-red-600 hover:bg-red-100"
                                            }`}
                                        >
                                            <FaTrash className="text-xs" />
                                            {deleteLoading === review.id ? "Deleting..." : "Delete"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {filtered.length > 0 && (
                    <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-500">
                        Showing {filtered.length} of {totalReviews} reviews
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReviewsPage;