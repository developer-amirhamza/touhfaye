// redux/slices/reviewSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import toast from 'react-hot-toast';

export interface Review {
    id: string;
    rating: number;
    comment?: string;
    userId: string;
    user: {
        id: string;
        name: string;
        avatar?: string;
    };
    productId: string;
    createdAt: string;
    updatedAt: string;
}

interface ReviewState {
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: ReviewState = {
    reviews: [],
    averageRating: 0,
    totalReviews: 0,
    status: 'idle',
    error: null,
};

// Fetch reviews for a product
export const fetchProductReviews = createAsyncThunk(
    'reviews/fetchProductReviews',
    async (productId: string, { rejectWithValue }) => {
        try {
            const response = await Axios({
                ...SummeryApi.getProductReviews,
                data: { productId },
            });
            return response.data?.data; // { reviews, averageRating, totalReviews }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
        }
    }
);

// Add a review
export const addReview = createAsyncThunk(
    'reviews/addReview',
    async ({ productId, rating, comment }: { productId: string; rating: number; comment: string }, { rejectWithValue }) => {
        try {
            const response = await Axios({
                ...SummeryApi.addReview,
                data: { productId, rating, comment },
            });
            toast.success(response.data?.message || 'Review added');
            return response.data?.data; // the new review
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add review');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

// Update review
export const updateReview = createAsyncThunk(
    'reviews/updateReview',
    async ({ reviewId, rating, comment }: { reviewId: string; rating: number; comment: string }, { rejectWithValue }) => {
        try {
            const response = await Axios({
                ...SummeryApi.updateReview,
                data: { reviewId, rating, comment },
            });
            toast.success(response.data?.message || 'Review updated');
            return response.data?.data;
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update review');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

// Delete review
export const deleteReview = createAsyncThunk(
    'reviews/deleteReview',
    async (reviewId: string, { rejectWithValue }) => {
        try {
            const response = await Axios({
                ...SummeryApi.deleteReview,
                data: { reviewId },
            });
            toast.success(response.data?.message || 'Review deleted');
            return reviewId;
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete review');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

const reviewSlice = createSlice({
    name: 'reviews',
    initialState,
    reducers: {
        clearReviews: (state) => {
            state.reviews = [];
            state.averageRating = 0;
            state.totalReviews = 0;
            state.status = 'idle';
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch reviews
            .addCase(fetchProductReviews.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchProductReviews.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.reviews = action.payload.reviews;
                state.averageRating = action.payload.averageRating;
                state.totalReviews = action.payload.totalReviews;
            })
            .addCase(fetchProductReviews.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            // Add review – refetch after successful addition (simple approach)
            .addCase(addReview.fulfilled, (state, action) => {
                // Option 1: push the new review to state
                if (action.payload) {
                    state.reviews.unshift(action.payload);
                    // Recalculate average
                    const total = state.reviews.reduce((sum, r) => sum + r.rating, 0);
                    state.averageRating = total / state.reviews.length;
                    state.totalReviews = state.reviews.length;
                }
            })
            // Update review – update in place
            .addCase(updateReview.fulfilled, (state, action) => {
                const updated = action.payload;
                const index = state.reviews.findIndex(r => r.id === updated.id);
                if (index !== -1) {
                    state.reviews[index] = updated;
                    const total = state.reviews.reduce((sum, r) => sum + r.rating, 0);
                    state.averageRating = total / state.reviews.length;
                }
            })
            // Delete review – remove from list
            .addCase(deleteReview.fulfilled, (state, action) => {
                state.reviews = state.reviews.filter(r => r.id !== action.payload);
                state.totalReviews = state.reviews.length;
                const total = state.reviews.reduce((sum, r) => sum + r.rating, 0);
                state.averageRating = state.reviews.length ? total / state.reviews.length : 0;
            });
    },
});

export const { clearReviews } = reviewSlice.actions;
export default reviewSlice.reducer;