import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';

export interface Subcategory {
    id: string;
    title: string;
    slug: string;
    categoryId: string;
    products?: any[];
}

interface SubcategoryState {
    subcategories: Subcategory[];
    selectedSubcategory: Subcategory | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: SubcategoryState = {
    subcategories: [],
    selectedSubcategory: null,
    status: 'idle',
    error: null,
};

export const fetchSubcategoriesByCategory = createAsyncThunk(
    'subcategories/fetchByCategory',
    async (categoryId: string, { rejectWithValue }) => {
        try {
            const response = await Axios({ ...SummeryApi.fetchSubcategoriesByCategory, params: { categoryId } });
            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

export const fetchSubcategoryBySlug = createAsyncThunk(
    'subcategories/fetchBySlug',
    async ({ categoryId, slug }: { categoryId: string; slug: string }, { rejectWithValue }) => {
        try {
            const response = await Axios({ ...SummeryApi.fetchSubcategoryBySlug, params: { categoryId, slug } });
            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

export const createSubcategory = createAsyncThunk(
    'subcategories/create',
    async ({ title, categoryId }: { title: string; categoryId: string }, { rejectWithValue }) => {
        try {
            const response = await Axios({ ...SummeryApi.createSubcategory, data: { title, categoryId } });
            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

export const updateSubcategory = createAsyncThunk(
    'subcategories/update',
    async ({ id, title }: { id: string; title: string }, { rejectWithValue }) => {
        try {
            const response = await Axios({ ...SummeryApi.updateSubcategory, data: { id, title } });
            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

export const deleteSubcategory = createAsyncThunk(
    'subcategories/delete',
    async (id: string, { rejectWithValue }) => {
        try {
            await Axios({ ...SummeryApi.deleteSubcategory, data: { id } });
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

const subcategorySlice = createSlice({
    name: 'subcategories',
    initialState,
    reducers: {
        clearSelectedSubcategory: (state) => {
            state.selectedSubcategory = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSubcategoriesByCategory.fulfilled, (state, action) => {
                state.subcategories = action.payload;
            })
            .addCase(fetchSubcategoryBySlug.fulfilled, (state, action) => {
                state.selectedSubcategory = action.payload;
            })
            .addCase(createSubcategory.fulfilled, (state, action) => {
                state.subcategories.push(action.payload);
            })
            .addCase(updateSubcategory.fulfilled, (state, action) => {
                const idx = state.subcategories.findIndex(s => s.id === action.payload.id);
                if (idx !== -1) state.subcategories[idx] = action.payload;
                if (state.selectedSubcategory?.id === action.payload.id) state.selectedSubcategory = action.payload;
            })
            .addCase(deleteSubcategory.fulfilled, (state, action) => {
                state.subcategories = state.subcategories.filter(s => s.id !== action.payload);
                if (state.selectedSubcategory?.id === action.payload) state.selectedSubcategory = null;
            });
    },
});

export const { clearSelectedSubcategory } = subcategorySlice.actions;
export default subcategorySlice.reducer;