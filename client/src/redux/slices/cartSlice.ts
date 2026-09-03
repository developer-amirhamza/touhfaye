// redux/slices/cartSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";

export interface CartItem {
    id: string;           // cart item id
    productId: string;
    product: {
        id: string;
        title: string;
        price: number;
        images: string[];
        stock: number;
        discount:number,
    };
    quantity: number;
    // Set when the shopper chose "Subscribe & Save" for this line (days).
    subscriptionIntervalDays?: number | null;
}

interface Cart {
    id: string;
    items: CartItem[];
}

interface CartState {
    cart: Cart | null;
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
}

const initialState: CartState = {
    cart: null,
    status: "idle",
    error: null,
};

// Async thunks
export const fetchCart = createAsyncThunk(
    "cart/fetchCart",
    async (_, { rejectWithValue }) => {
        try {
            const response = await Axios({ ...SummeryApi.fetchCart });
            return response.data?.data; // returns cart object
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch cart");
        }
    }
);

export const addToCart = createAsyncThunk(
    "cart/addToCart",
    async (
        { productId, quantity, subscriptionIntervalDays }: { productId: string; quantity: number; subscriptionIntervalDays?: number | null },
        { rejectWithValue }
    ) => {
        try {
            const response = await Axios({
                ...SummeryApi.addCart,
                data: { productId, quantity, subscriptionIntervalDays },
            });
            return response.data?.data; // updated cart
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to add to cart");
        }
    }
);

export const updateCartItem = createAsyncThunk(
    "cart/updateCartItem",
    async (
        { itemId, quantity, subscriptionIntervalDays }: { itemId: string; quantity: number; subscriptionIntervalDays?: number | null },
        { rejectWithValue }
    ) => {
        try {
            const response = await Axios({
                ...SummeryApi.updateCart,
                data: { itemId, quantity, subscriptionIntervalDays },
            });
            return response.data?.data; // updated cart
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to update cart");
        }
    }
);

export const deleteCartItem = createAsyncThunk(
    "cart/deleteCartItem",
    async (itemId: string, { rejectWithValue }) => {
        try {
            const response = await Axios({
                ...SummeryApi.deleteCart,
                data: { itemId },
            });
            return response.data?.data; // updated cart
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to remove item");
        }
    }
);

export const mergeCartAfterLogin = createAsyncThunk(
    "cart/mergeCart",
    async (_, { rejectWithValue }) => {
        try {
            const response = await Axios({ ...SummeryApi.mergeCart });
            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to merge cart");
        }
    }
);

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        clearCartState: (state) => {
            state.cart = null;
            state.status = "idle";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchCart
            .addCase(fetchCart.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.cart = action.payload;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            })
            // addToCart
            .addCase(addToCart.fulfilled, (state, action) => {
                state.cart = action.payload;
            })
            // updateCartItem
            .addCase(updateCartItem.fulfilled, (state, action) => {
                state.cart = action.payload;
            })
            // deleteCartItem
            .addCase(deleteCartItem.fulfilled, (state, action) => {
                state.cart = action.payload;
            })
            // mergeCart
            .addCase(mergeCartAfterLogin.fulfilled, (state, action) => {
                state.cart = action.payload;
            });
    },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;