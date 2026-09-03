"use client";
import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';

import InfiniteScroll from 'react-infinite-scroll-component';
import nothingImage from "@/assets/empty-box.gif";
import Image from 'next/image';
import AxiosToastError from '@/utils/AxiosToastError';
import ProductGrid from '../../components/ProductGrid';
import ProductCard from '../../components/ProductCard';

interface Product {
    id: string;
    title: string;
    price: number;
    images: string[];
    // ... other product fields
}

const SearchContent = () => {
    const searchParams = useSearchParams();
    const textSearch = searchParams.get('q') || ''; // ?q=keyword

    const [data, setData] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadingArrayCard = new Array(10).fill(null);

    const fetchSearchProduct = useCallback(async () => {
        if (!textSearch) return;
        try {
            setLoading(true);
            const response = await Axios({
                ...SummeryApi.searchProduct,
                params: {
                    q: textSearch,
                    page: page,
                    limit: 20, // adjust as needed
                },
            });
            // Assuming response structure: { data: { data: products, totalNoPage: number } }
            const newProducts = response.data?.data || [];

            if (page === 1) {
                setData(newProducts);
            } else {
                setData((prev) => [...prev, ...newProducts]);
            }
            const totalPages = response.data?.totalNoPage || 1;
            setTotalPage(totalPages);
            setHasMore(page < totalPages);
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    }, [textSearch, page]);

    useEffect(() => {
        // Reset state when search query changes
        setPage(1);
        setData([]);
        setHasMore(true);
    }, [textSearch]);

    useEffect(() => {
        if (textSearch) {
            fetchSearchProduct();
        }
    }, [fetchSearchProduct, textSearch, page]);

    const handleFetchMore = () => {
        if (hasMore && !loading) {
            setPage((prev) => prev + 1);
        }
    };

    if (!textSearch) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <ProductGrid/>
            </div>
        );
    }

    return (
        <section className="bg-white">
            <div className="container mx-auto p-4">
                <p className="font-semibold text-neutral-600 mb-4">
                    Search Results for "{textSearch}": {data.length} products
                </p>
                <InfiniteScroll
                    dataLength={data.length}
                    next={handleFetchMore}
                    hasMore={hasMore}
                    loader={<div className="text-center py-4">Loading more...</div>}
                    endMessage={<div className="text-center py-4 text-neutral-500">No more products</div>}
                >
                    <div className="flex flex-wrap gap-4 justify-center items-center my-4">
                        {loading && page === 1
                            ? loadingArrayCard.map((_, index) => (
                                <div
                                    key={index}
                                    className="border border-blue-200 p-2 grid gap-3 max-w-52 rounded animate-pulse"
                                >
                                    <div className="min-h-20 bg-blue-100/80 rounded"></div>
                                    <div className="p-3 bg-blue-100/80 rounded w-20"></div>
                                    <div className="p-3 bg-blue-100/80 rounded"></div>
                                    <div className="p-3 bg-blue-100/80 rounded w-14"></div>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="p-3 bg-blue-100/80 rounded w-20"></div>
                                        <div className="p-3 bg-blue-100/80 rounded w-20"></div>
                                    </div>
                                </div>
                            ))
                            : data.map((product, idx) => (
                                <ProductCard
                                    data={product} key={`${product.id}-${idx}`} />
                            ))}
                    </div>
                </InfiniteScroll>
                {!data.length && !loading && (
                    <div className="flex flex-col w-full items-center justify-center mx-auto">
                        <Image
                            src={nothingImage}
                            alt="no data"
                            className="w-full h-full max-h-xs max-w-xs rounded-md object-scale-down"
                        />
                        <p className="font-semibold my-4 text-2xl text-neutral-500">No Products Found!</p>
                    </div>
                )}
            </div>
        </section>
    );
};

const SearchPage = () => {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
            <SearchContent />
        </Suspense>
    );
};

export default SearchPage;