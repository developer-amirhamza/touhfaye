"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { AppDispatch, RootState } from '@/redux/store';
import { removeFavorite, clearFavorites } from '@/redux/slices/favoriteSlice';
import { addToCart } from '@/redux/slices/cartSlice';
import { DisplayPriceInBdt } from '@/utils/DisplayPriceInBdt';
import { validURLConvert } from '@/utils/validURLConvart';
import toast from 'react-hot-toast';

interface Props {
    close: () => void;
}

// Matches the design mock's "Favourites drawer" — a slide-out panel from the
// right, same treatment as the cart drawer.
const FavoritesDrawer: React.FC<Props> = ({ close }) => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { items } = useSelector((state: RootState) => state.favoriteSlice);

    const addOne = async (id: string) => {
        const result = await dispatch(addToCart({ productId: id, quantity: 1 }));
        if (addToCart.fulfilled.match(result)) {
            toast.success('Added to bag');
        } else {
            toast.error((result.payload as string) || 'Failed to add');
        }
    };

    const addAllToBag = async () => {
        for (const item of items) {
            await dispatch(addToCart({ productId: item.id, quantity: 1 }));
        }
        toast.success('Added all to bag');
    };

    const goToBag = () => {
        close();
        router.push('/carts');
    };

    return (
        <>
            <div onClick={close} className="fixed inset-0 bg-[#12281C]/32 z-[95]" />
            <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                className="fixed top-0 right-0 bottom-0 z-[96] w-100 max-w-[92vw] bg-background border-l border-primary-hover shadow-[-18px_0_40px_rgba(18,40,28,.14)] flex flex-col"
            >
                <div className="flex items-center justify-between gap-4 px-6.5 py-6 border-b border-primary-hover">
                    <div>
                        <div className="font-secondary text-2xl text-title">Favourites</div>
                        <div className="text-[12px] text-accent font-light mt-1">
                            {items.length} item{items.length === 1 ? '' : 's'} saved
                        </div>
                    </div>
                    <button onClick={close} aria-label="Close" className="text-title p-1">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6.5">
                    {items.length === 0 ? (
                        <div className="py-15 text-center">
                            <div className="font-secondary text-lg text-title">Nothing saved yet</div>
                            <div className="text-[13px] text-foreground font-light mt-2 leading-relaxed">
                                Tap the heart on any product to keep it here.
                            </div>
                        </div>
                    ) : (
                        items.map((item) => {
                            const url = `/product/${validURLConvert(item.title)}_${item.id}`;
                            return (
                                <div key={item.id} className="flex gap-4 items-center py-4.5 border-b border-primary-hover">
                                    <Link href={url} onClick={close} className="w-18 aspect-[4/5] flex-none bg-primary overflow-hidden">
                                        {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" />}
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={url} onClick={close} className="font-secondary text-[15px] text-title leading-snug line-clamp-2">
                                            {item.title}
                                        </Link>
                                        {item.pack && <div className="text-[12px] text-accent font-light mt-1">{item.pack}</div>}
                                        <div className="flex items-center justify-between gap-2.5 mt-2.5">
                                            <span className="text-[13.5px] text-title">{DisplayPriceInBdt(item.price)}</span>
                                            <button onClick={() => addOne(item.id)} className="text-[10.5px] tracking-[.16em] text-title border-b border-title pb-0.5">
                                                ADD
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={() => dispatch(removeFavorite(item.id))} title="Remove" className="text-accent text-base self-start">
                                        ×
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {items.length > 0 && (
                    <div className="px-6.5 py-6 border-t border-primary-hover flex flex-col gap-2.5">
                        <button
                            onClick={addAllToBag}
                            className="bg-secondary hover:bg-secondary-hover text-background h-12.5 text-[11px] tracking-[.18em] transition-colors"
                        >
                            ADD ALL TO BAG
                        </button>
                        <button
                            onClick={goToBag}
                            className="border border-primary-hover hover:border-secondary text-title h-11.5 text-[11px] tracking-[.18em] transition-colors"
                        >
                            VIEW BAG
                        </button>
                    </div>
                )}
            </motion.aside>
        </>
    );
};

export default FavoritesDrawer;
