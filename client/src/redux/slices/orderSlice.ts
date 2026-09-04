// redux/slices/orderSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";

export interface OrderItem {
    id: string;
    productName: string;
    productImage?: string;
    price: number;
    quantity: number;
    total: number;
}

export interface Order {
    id: string;
    orderNumber: string;
    email: string;
    phone: string;
    shippingAddress: string;
    subtotal: number;
    total: number;
    paymentMethod: "COD" | "STRIPE";
    paymentStatus: string;
    orderStatus: string;
    items: OrderItem[];
    createdAt: string;
}

interface OrderState {
    currentOrder: Order | null;
    orders: Order[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
    stripeUrl: string | null;
}

const initialState: OrderState = {
    currentOrder: null,
    orders: [],
    status: "idle",
    error: null,
    stripeUrl: null,
};

// Place an order WITHOUT instant card payment — used for NDIS / Home Care
// Package funding orders (paymentMethod "NDIS" | "HCP"), which are completed
// against the participant's funding and settled by the team afterwards.
export const placeOrder = createAsyncThunk(
    "order/placeOrder",
    async (
        orderData: {
            firstName?: string;
            lastName?: string;
            email: string;
            phone: string;
            orderNote: string;
            shippingAddress: string;
            paymentMethod: string;
            fundingDetails?: any;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await Axios({
                ...SummeryApi.placeOrder,
                data: orderData,
            });
            return response.data?.data; // returns created order
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to place order");
        }
    }
);

// Create Stripe Checkout Session
export const createCheckoutSession = createAsyncThunk(
    "order/createCheckoutSession",
    async (checkoutData: { name?: string; firstName?: string; lastName?: string; email: string; phone: string; shippingAddress: string; orderNote?: string; successUrl?: string; cancelUrl?: string }, { rejectWithValue }) => {
        try {
            const response = await Axios({
                ...SummeryApi.createCheckoutSession,
                data: checkoutData,
            });
            return response.data?.url; // Stripe Checkout URL
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to initiate payment");
        }
    }
);

// Fetch logged-in user's orders
export const fetchMyOrders = createAsyncThunk(
    "order/fetchMyOrders",
    async (_, { rejectWithValue }) => {
        try {
            const response = await Axios({ ...SummeryApi.fetchMyOrders });
            return response.data?.data; // array of orders
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch orders");
        }
    }
);

// Lookup order by orderNumber + email (for guests)
export const fetchOrderByNumber = createAsyncThunk(
    "order/fetchOrderByNumber",
    async ({ orderNumber, email }: { orderNumber: string; email: string }, { rejectWithValue }) => {
        try {
            const response = await Axios({
                ...SummeryApi.fetchOrderByNumber,
                params: { orderNumber, email },
            });
            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Order not found");
        }
    }
);

const orderSlice = createSlice({
    name: "order",
    initialState,
    reducers: {
        clearCurrentOrder: (state) => {
            state.currentOrder = null;
        },
        clearStripeUrl: (state) => {
            state.stripeUrl = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(createCheckoutSession.pending, (state) => {
            state.status = "loading";
        })
            .addCase(createCheckoutSession.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.stripeUrl = action.payload;
            })
            .addCase(createCheckoutSession.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            })
            // placeOrder (NDIS / HCP funding orders)
            .addCase(placeOrder.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(placeOrder.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.currentOrder = action.payload;
            })
            .addCase(placeOrder.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            })
            // fetchMyOrders
            .addCase(fetchMyOrders.fulfilled, (state, action) => {
                state.orders = action.payload;
            })
            // fetchOrderByNumber
            .addCase(fetchOrderByNumber.fulfilled, (state, action) => {
                state.currentOrder = action.payload;
            });
    },
});

export const { clearCurrentOrder, clearStripeUrl } = orderSlice.actions;
export default orderSlice.reducer;