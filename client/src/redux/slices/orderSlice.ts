// redux/slices/orderSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";

export interface StatusHistoryEntry {
    status: string;
    at: string;
}

export interface OrderItem {
    id: string;
    productName: string;
    productImage?: string;
    price: number;
    quantity: number;
    total: number;
    // "" / null for a plain product with no picker — see Product.variants
    // and Product.swatches.
    variantLabel?: string | null;
    swatchLabel?: string | null;
}

export interface Order {
    id: string;
    orderNumber: string;
    email: string;
    phone: string;
    shippingAddress: string;
    subtotal: number;
    shippingCost?: number;
    total: number;
    paymentMethod: "COD" | "STRIPE";
    paymentStatus: string;
    orderStatus: string;
    statusHistory?: StatusHistoryEntry[] | null;
    courierName?: string | null;
    courierTrackingLink?: string | null;
    items: OrderItem[];
    createdAt: string;
}

interface OrderState {
    currentOrder: Order | null;
    orders: Order[];
    // Drives the NDIS/HCP placeOrder + Stripe checkout flow only.
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
    // Separate from `status` above — sharing one field meant that right
    // after placing an order (which sets `status` to "succeeded"), the
    // orders list page would see a non-"idle" status and skip fetching
    // entirely, leaving a just-placed order invisible on /my-orders.
    myOrdersStatus: "idle" | "loading" | "succeeded" | "failed";
    myOrdersError: string | null;
    // For fetchOrderByNumber / fetchMyOrderByNumber, which both populate
    // currentOrder — kept apart from `status` for the same reason.
    currentOrderStatus: "idle" | "loading" | "succeeded" | "failed";
    currentOrderError: string | null;
    stripeUrl: string | null;
}

const initialState: OrderState = {
    currentOrder: null,
    orders: [],
    status: "idle",
    error: null,
    myOrdersStatus: "idle",
    myOrdersError: null,
    currentOrderStatus: "idle",
    currentOrderError: null,
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
            deliveryArea?: "DHAKA" | "OUTSIDE";
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

// Fetch one of the signed-in user's own orders, by order number — used by
// the order detail/tracking page reached from "Track order" in /my-orders.
export const fetchMyOrderByNumber = createAsyncThunk(
    "order/fetchMyOrderByNumber",
    async (orderNumber: string, { rejectWithValue }) => {
        try {
            const response = await Axios({
                ...SummeryApi.fetchMyOrderByNumber,
                url: `${SummeryApi.fetchMyOrderByNumber.url}/${orderNumber}`,
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
            state.currentOrderStatus = "idle";
            state.currentOrderError = null;
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
            .addCase(fetchMyOrders.pending, (state) => {
                state.myOrdersStatus = "loading";
                state.myOrdersError = null;
            })
            .addCase(fetchMyOrders.fulfilled, (state, action) => {
                state.myOrdersStatus = "succeeded";
                state.orders = action.payload;
            })
            .addCase(fetchMyOrders.rejected, (state, action) => {
                state.myOrdersStatus = "failed";
                state.myOrdersError = action.payload as string;
            })
            // fetchOrderByNumber / fetchMyOrderByNumber (both populate currentOrder)
            .addCase(fetchOrderByNumber.pending, (state) => {
                state.currentOrderStatus = "loading";
                state.currentOrderError = null;
            })
            .addCase(fetchOrderByNumber.fulfilled, (state, action) => {
                state.currentOrderStatus = "succeeded";
                state.currentOrder = action.payload;
            })
            .addCase(fetchOrderByNumber.rejected, (state, action) => {
                state.currentOrderStatus = "failed";
                state.currentOrderError = action.payload as string;
            })
            .addCase(fetchMyOrderByNumber.pending, (state) => {
                state.currentOrderStatus = "loading";
                state.currentOrderError = null;
            })
            .addCase(fetchMyOrderByNumber.fulfilled, (state, action) => {
                state.currentOrderStatus = "succeeded";
                state.currentOrder = action.payload;
            })
            .addCase(fetchMyOrderByNumber.rejected, (state, action) => {
                state.currentOrderStatus = "failed";
                state.currentOrderError = action.payload as string;
            });
    },
});

export const { clearCurrentOrder, clearStripeUrl } = orderSlice.actions;
export default orderSlice.reducer;