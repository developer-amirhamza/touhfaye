"use client";
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { toggleFavorite, FavoriteItem } from '@/redux/slices/favoriteSlice';
import toast from 'react-hot-toast';

interface Props {
    product: { id: string; title: string; price: number; images?: string[]; pack?: string | null };
    className?: string;
    size?: number;
}

// Heart toggle used on product cards and the product detail gallery — matches
// the design mock's favourite icon (outline when unsaved, filled when saved).
const FavoriteButton: React.FC<Props> = ({ product, className = '', size = 17 }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { items } = useSelector((state: RootState) => state.favoriteSlice);
    const active = items.some((i) => i.id === product.id);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const item: FavoriteItem = {
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.images?.[0],
            pack: product.pack,
        };
        dispatch(toggleFavorite(item));
        toast.success(active ? 'Removed from favourites' : 'Saved to favourites');
    };

    return (
        <button
            onClick={handleClick}
            title="Add to favourites"
            aria-label={active ? 'Remove from favourites' : 'Add to favourites'}
            className={className}
        >
            <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                fill={active ? '#173124' : 'none'}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            >
                <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" />
            </svg>
        </button>
    );
};

export default FavoriteButton;
