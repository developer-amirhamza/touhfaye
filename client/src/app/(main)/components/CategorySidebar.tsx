"use client";
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchCategories } from '@/redux/slices/categorySlice';
import Loader from './UI/Loader';

const CategorySidebar = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { categories, status } = useSelector((state: RootState) => state.categorySlice);
    const pathname = usePathname();

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchCategories());
        }
    }, [status, dispatch]);

    if (status === 'loading') {
        return <Loader/>
    }

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-lg mb-3">Categories</h3>
            <ul className="space-y-2">
                <li>
                    <Link
                        href="/products"
                        className={`text-sm hover:text-blue-600 ${pathname === '/products' ? 'text-blue-600 font-medium' : 'text-neutral-600'}`}
                    >
                        All Products
                    </Link>
                </li>
                {categories.map((cat) => (
                    <li key={cat.id}>
                        <Link
                            href={`/category/${cat.slug}`}
                            className={`text-sm hover:text-blue-600 ${pathname === `/category/${cat.slug}` ? 'text-blue-600 font-medium' : 'text-neutral-600'}`}
                        >
                            {cat.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CategorySidebar;