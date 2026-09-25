"use client";
import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

const CategoryCircles = () => {
    const { categories } = useSelector((state: RootState) => state.categorySlice);

    if (categories.length === 0) return null;

    return (
        <section className="container mx-auto px-6 pt-16 pb-2">
            <div className="flex justify-between items-baseline gap-5 flex-wrap mb-7">
                <h2 className="font-secondary text-3xl text-title">Shop by category</h2>
                <Link href="/products" className="text-[11px] tracking-[.16em] border-b border-secondary text-secondary pb-1">
                    ALL PRODUCTS
                </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {categories.map((cat) => (
                    <Link
                        key={cat.id}
                        href={`/products?category=${cat.id}`}
                        className="flex flex-col items-center text-center w-full max-w-60 mx-auto group"
                    >
                        <div className="w-full aspect-square rounded-full overflow-hidden border border-primary-hover p-2 bg-background">
                            <div
                                className="w-full h-full rounded-full bg-primary bg-cover bg-center transition-transform group-hover:scale-105"
                                style={cat.image ? { backgroundImage: `url(${cat.image})` } : undefined}
                            />
                        </div>
                        <div className="font-secondary text-lg text-title mt-4">{cat.title}</div>
                        <div className="text-[12px] text-accent font-light mt-1.5">
                            {cat.products?.length ?? 0} product{(cat.products?.length ?? 0) === 1 ? '' : 's'}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default CategoryCircles;
