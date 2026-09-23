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
        <section className="bg-background min-h-screen">
            <div className="container mx-auto px-6 py-10">
                <p className="text-[12.5px] text-accent font-light mb-6">
                    {data.length} result{data.length === 1 ? '' : 's'} for &ldquo;{textSearch}&rdquo;
                </p>
                <InfiniteScroll
                    dataLength={data.length}
                    next={handleFetchMore}
                    hasMore={hasMore}
                    loader={<div className="text-center py-4 text-foreground font-light">Loading more…</div>}
                    endMessage={data.length > 0 ? <div className="text-center py-4 text-foreground font-light">No more products</div> : null}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {loading && page === 1
                            ? loadingArrayCard.map((_, index) => (
                                <div
                                    key={index}
                                    className="bg-white border border-primary-hover p-2 grid gap-3 rounded-[18px] animate-pulse"
                                >
                                    <div className="min-h-40 bg-primary rounded"></div>
                                    <div className="p-3 bg-primary rounded w-20"></div>
                                    <div className="p-3 bg-primary rounded"></div>
                                    <div className="p-3 bg-primary rounded w-14"></div>
                                </div>
                            ))
                            : data.map((product, idx) => (
                                <ProductCard
                                    data={product} key={`${product.id}-${idx}`} />
                            ))}
                    </div>
                </InfiniteScroll>
                {!data.length && !loading && (
                    <div className="flex flex-col w-full items-center justify-center mx-auto py-16">
                        <Image
                            src={nothingImage}
                            alt="No products found"
                            className="w-full h-full max-h-xs max-w-xs rounded-md object-scale-down"
                        />
                        <p className="font-secondary text-2xl text-title mt-4">Nothing matches that search</p>
                        <p className="text-foreground font-light mt-1">Try a different word, or browse the full collection.</p>
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