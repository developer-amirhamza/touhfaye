import { SummeryApi } from "@/app/common/SummeryApi"
import Axios from "@/utils/Axios"
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"


interface Product {
    id: number,
    title: string,
    description: string,
    price: number,
    discount:number
}

interface productState {
    products:Product[],
    status:string,
    error:null | string,
}


const initialState:productState = {
    products:[],
    status:"idle",
    error:"",
}


export const fetchProducts = createAsyncThunk("/products/fetchAllProducts",
    async()=>{
        const response = await Axios({
            ...SummeryApi.fetchProducts,
        });
        return response.data?.data;
    }
)






const productSlice = createSlice({
    name:"products",
    initialState,
    reducers:{},
    extraReducers(builder) {
        builder.addCase(fetchProducts.pending,(state)=>{
            state.status="loading"
        }).addCase(fetchProducts.fulfilled,(state,action)=>{
            state.status = "succeeded",
            state.products = action.payload
        }).addCase(fetchProducts.rejected,(state,action)=>{
            state.status = "failed",
            state.error = action.error.message || "Failed to fetch products"
        })
    },
})




export default productSlice.reducer;