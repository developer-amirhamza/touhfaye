// redux/slices/categorySlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';

export interface Category {
    id: string;
    title: string;
    slug: string;
    products?: any[];
    createdAt: string;
    updatedAt: string;
}

interface CategoryState {
    categories: Category[];
    selectedCategory: Category | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: CategoryState = {
    categories: [],
    selectedCategory: null,
    status: 'idle',
    error: null,
};

// Fetch all categories
export const fetchCategories = createAsyncThunk(
    'categories/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await Axios({ ...SummeryApi.getAllCategories });
            return response.data?.data; // array of categories
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
        }
    }
);

// Fetch single category by slug (with products)
export const fetchCategoryBySlug = createAsyncThunk(
    'categories/fetchBySlug',
    async (slug: string, { rejectWithValue }) => {
        try {
            const response = await Axios({
                ...SummeryApi.getCategoryBySlug,
                params: { slug },
            });
            return response.data?.data; // category object with products
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Category not found');
        }
    }
);

// Admin: Create category
export const createCategory = createAsyncThunk(
    'categories/create',
    async (title: string, { rejectWithValue }) => {
        try {
            const response = await Axios({
                ...SummeryApi.createCategory,
                data: { title },
            });
            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create category');
        }
    }
);

// Admin: Update category
export const updateCategory = createAsyncThunk(
    'categories/update',
    async ({ id, title }: { id: string; title: string }, { rejectWithValue }) => {
        try {
            const response = await Axios({
                ...SummeryApi.updateCategory,
                data: { id, title },
            });
            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update category');
        }
    }
);

// Admin: Delete category
export const deleteCategory = createAsyncThunk(
    'categories/delete',
    async (id: string, { rejectWithValue }) => {
        try {
            await Axios({ ...SummeryApi.deleteCategory, data: { id } });
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
        }
    }
);

const categorySlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        clearSelectedCategory: (state) => {
            state.selectedCategory = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all
            .addCase(fetchCategories.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            // Fetch by slug
            .addCase(fetchCategoryBySlug.fulfilled, (state, action) => {
                state.selectedCategory = action.payload;
            })
            // Create category (admin)
            .addCase(createCategory.fulfilled, (state, action) => {
                state.categories.push(action.payload);
            })
            // Update category (admin)
            .addCase(updateCategory.fulfilled, (state, action) => {
                const index = state.categories.findIndex(c => c.id === action.payload.id);
                if (index !== -1) state.categories[index] = action.payload;
                if (state.selectedCategory?.id === action.payload.id) state.selectedCategory = action.payload;
            })
            // Delete category (admin)
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.categories = state.categories.filter(c => c.id !== action.payload);
                if (state.selectedCategory?.id === action.payload) state.selectedCategory = null;
            });
    },
});

export const { clearSelectedCategory } = categorySlice.actions;
export default categorySlice.reducer;