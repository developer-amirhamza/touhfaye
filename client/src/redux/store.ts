"use client"
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlices"
import productReducer from "./slices/productSlice"
import cartReducer from "./slices/cartSlice"
import orderReducer from "./slices/orderSlice";
import reviewReducer from "./slices/reviewSlice";
import categoryReducer from "./slices/categorySlice";
import subcategoryReducer from "./slices/subcategorySlice";




export const store = configureStore({
    reducer:{
        userSlice:userReducer,
        productSlice:productReducer,
        orderSlice:orderReducer,
        cartSlice:cartReducer,
        reviewSlice:reviewReducer,
        categorySlice:categoryReducer,
        subcategorySlice:subcategoryReducer,
    }
})

export type RootState = ReturnType<typeof store.getState >
export type AppDispatch = typeof store.dispatch;