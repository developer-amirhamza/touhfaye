// redux/slices/favoriteSlice.ts
//
// Favourites are a lightweight "save for later" list, same as the design
// mock's heart icon — no account is required to use it, so it's kept
// entirely client-side in localStorage rather than round-tripping to the
// server (there's no guest/session concept to hang a server-side wishlist
// off outside of an authenticated user, and gating a simple heart-tap
// behind sign-in would be a worse experience than the mock's).
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FavoriteItem {
    id: string;
    title: string;
    price: number;
    image?: string;
    pack?: string | null;
}

interface FavoriteState {
    items: FavoriteItem[];
    hydrated: boolean;
}

const STORAGE_KEY = "touhfaye_favorites";

const initialState: FavoriteState = {
    items: [],
    hydrated: false,
};

const favoriteSlice = createSlice({
    name: "favorites",
    initialState,
    reducers: {
        hydrateFavorites: (state, action: PayloadAction<FavoriteItem[]>) => {
            state.items = action.payload;
            state.hydrated = true;
        },
        toggleFavorite: (state, action: PayloadAction<FavoriteItem>) => {
            const idx = state.items.findIndex((i) => i.id === action.payload.id);
            if (idx >= 0) {
                state.items.splice(idx, 1);
            } else {
                state.items.push(action.payload);
            }
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
            } catch {
                /* localStorage unavailable — favourites just won't persist across reloads */
            }
        },
        removeFavorite: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter((i) => i.id !== action.payload);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
            } catch {
                /* ignore */
            }
        },
        clearFavorites: (state) => {
            state.items = [];
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch {
                /* ignore */
            }
        },
    },
});

export const loadFavoritesFromStorage = (): FavoriteItem[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const { hydrateFavorites, toggleFavorite, removeFavorite, clearFavorites } = favoriteSlice.actions;
export default favoriteSlice.reducer;
