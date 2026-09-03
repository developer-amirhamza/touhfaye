"use client";
import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchCategories } from '@/redux/slices/categorySlice';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import InfiniteScroll from 'react-infinite-scroll-component';
import Link from 'next/link';
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud';
import { getDisplayPrice } from '@/utils/PriceWithDiscount';
import { validURLConvert } from '@/utils/validURLConvart';
import AddToCartButton from '../../components/UI/AddToCartBtn';
import Loader from '../../components/UI/Loader';
import Breadcrumb from '../../components/UI/Breadcrumb';
import FaqAccordion, { FaqItem } from '../../components/UI/FaqAccordion';

interface Product {
    id: string;
    title: string;
    description?: string;
    price: number;
    images: string[];
    discount: number;
    stock: number;
    sizes?: string[];
    pack?: string | null;
    absorbency?: string | null;
    isFeatured?: boolean;
    category?: { id: string; title: string; slug: string };
}

const SORTS = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to high' },
    { value: 'price_desc', label: 'Price: High to low' },
];

const ProductsContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { categories } = useSelector((state: RootState) => state.categorySlice);

    // Filter values live in the URL, same as before — shareable/back-button-safe.
    const textSearch = searchParams.get('q') || '';
    const categoryId = searchParams.get('category') || '';
    const absorbency = searchParams.get('absorbency') || '';
    const inStockOnly = searchParams.get('inStock') === 'true';
    const sort = searchParams.get('sort') || 'newest';

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // There's no dedicated absorbency taxonomy (unlike Category), so the real
    // option list is derived from the catalog itself — same approach used for
    // the blog page's category tabs.
    const [absorbencyOptions, setAbsorbencyOptions] = useState<string[]>([]);
    const [faqs, setFaqs] = useState<FaqItem[]>([]);

    const loadingArrayCard = new Array(9).fill(null);

    useEffect(() => {
        Axios({ ...SummeryApi.getFaqs, params: { surface: 'PRODUCT_LIST' } })
            .then((res) => {
                if (res.data?.success) setFaqs(res.data.data);
            })
            .catch(() => { /* embedded FAQs are optional — fail silently */ });
    }, []);

    useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    useEffect(() => {
        Axios({ ...SummeryApi.searchProduct, params: { page: 1, limit: 200 } })
            .then((res) => {
                const values = new Set<string>();
                (res.data?.data || []).forEach((p: Product) => {
                    if (p.absorbency) values.add(p.absorbency);
                });
                setAbsorbencyOptions(Array.from(values).sort());
            })
            .catch(() => {});
    }, []);

    // Single source of truth for the product list — category, absorbency,
    // stock and sort all flow through the same real search endpoint as text search.
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 20 };
            if (textSearch) params.q = textSearch;
            if (categoryId) params.category = categoryId;
            if (absorbency) params.absorbency = absorbency;
            if (inStockOnly) params.inStock = 'true';
            if (sort) params.sort = sort;

            const response = await Axios({ ...SummeryApi.searchProduct, params });

            const newProducts = response.data?.data || [];
            const totalPages = response.data?.totalNoPage || 1;

            if (page === 1) {
                setProducts(newProducts);
            } else {
                // Guards against react-infinite-scroll-component firing an
                // extra `next` call before `hasMore`/`loading` have settled
                // from the previous fetch, which would otherwise append the
                // same page's products a second time.
                setProducts((prev) => {
                    const seen = new Set(prev.map((p) => p.id));
                    return [...prev, ...newProducts.filter((p: Product) => !seen.has(p.id))];
                });
            }
            setTotalPage(totalPages);
            setHasMore(page < totalPages);
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    }, [textSearch, categoryId, absorbency, inStockOnly, sort, page]);

    // Reset pagination whenever a filter changes.
    useEffect(() => {
        setPage(1);
        setProducts([]);
        setHasMore(true);
    }, [textSearch, categoryId, absorbency, inStockOnly, sort]);

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchProducts, page]);

    const updateFilters = (updates: Record<string, string | undefined>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) newParams.set(key, value);
            else newParams.delete(key);
        });
        router.push(`/products?${newParams.toString()}`);
    };

    const clearFilters = () => router.push('/products');

    const handleFetchMore = () => {
        if (hasMore && !loading) setPage((prev) => prev + 1);
    };

    const activeSort = SORTS.find((s) => s.value === sort) ?? SORTS[0];
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        document.body.style.overflow = showFilters ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [showFilters]);

    // Shared between the tablet/desktop sidebar and the mobile filter drawer.
    const filterPanel = (
        <>
            <div>
                <div className="font-bold text-lg text-text-hover mb-2.5">Category</div>
                <div className="flex flex-col gap-1.5">
                    <button
                        onClick={() => updateFilters({ category: undefined })}
                        className={`text-left text-base flex justify-between gap-2.5 py-0.5 ${!categoryId ? 'text-secondary font-bold' : 'text-text-hover'}`}
                    >
                        All Categories
                    </button>
                    {categories.map((cat: any) => {
                        const on = categoryId === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => updateFilters({ category: cat.id })}
                                className={`text-left text-base flex justify-between gap-2.5 py-0.5 ${on ? 'text-secondary font-bold' : 'text-text-hover'}`}
                            >
                                {cat.title}
                                <span className="text-text font-normal">{cat.products?.length ?? ''}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {absorbencyOptions.length > 0 && (
                <div>
                    <div className="font-bold text-lg text-text-hover mb-2.5">Absorbency</div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => updateFilters({ absorbency: undefined })}
                            className={`rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors ${!absorbency ? 'bg-secondary text-background border-secondary' : 'bg-transparent text-text border-primary-hover'}`}
                        >
                            All
                        </button>
                        {absorbencyOptions.map((a) => {
                            const on = absorbency === a;
                            return (
                                <button
                                    key={a}
                                    onClick={() => updateFilters({ absorbency: a })}
                                    className={`rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors ${on ? 'bg-secondary text-background border-secondary' : 'bg-transparent text-text border-primary-hover'}`}
                                >
                                    {a}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <div className="font-bold text-lg text-text-hover mb-2.5">Availability</div>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'All', on: !inStockOnly, click: () => updateFilters({ inStock: undefined }) },
                        { label: 'In stock only', on: inStockOnly, click: () => updateFilters({ inStock: 'true' }) },
                    ].map((o) => (
                        <button
                            key={o.label}
                            onClick={o.click}
                            className={`rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors ${o.on ? 'bg-secondary text-background border-secondary' : 'bg-transparent text-text border-primary-hover'}`}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl p-5.5 bg-secondary text-background">
                <div className="font-secondary text-2xl leading-tight">Not sure what to buy?</div>
                <p className="text-sm text-background/85 leading-relaxed mt-2 mb-3.5">
                    Answer a few questions and get a product match.
                </p>
                <Link
                    href="/product-finder"
                    className="block text-center font-semibold rounded-full py-2.5 text-sm bg-white text-secondary hover:bg-primary transition-colors"
                >
                    Start the finder →
                </Link>
            </div>
        </>
    );

    return (
        <div className="bg-background min-h-screen">
            {/* Hero */}
            <section className="bg-secondary-light">
                <div className="max-w-310 mx-auto px-5 sm:px-7 pt-10 pb-9">
                    <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop' }]} />
                    <h1 className="font-secondary text-4xl md:text-5xl leading-tight text-text-hover mt-3 mb-2">
                        Buy incontinence products online
                    </h1>
                    <p className="text-lg text-secondary leading-relaxed max-w-2xl">
                        Pads, pull up pants, bed pads and skincare. Light through to overnight. Every order ships in plain, unmarked packaging.
                    </p>
                    <div className="flex gap-2.5 mt-5 flex-wrap">
                        {['✓ NDIS and Support at Home claimable', '✓ Free over $99', '✓ Same day dispatch before 2pm'].map((t) => (
                            <span key={t} className="bg-white text-secondary rounded-full px-4 py-2 text-sm font-semibold">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <section className="max-w-310 mx-auto px-5 sm:px-7 py-9 pb-16 grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[244px_1fr] gap-10 items-start">
                {/* Sidebar — inline from tablet up; mobile uses the Filters drawer below instead. */}
                <aside className="hidden md:flex flex-col gap-6.5 lg:sticky lg:top-6">
                    {filterPanel}
                </aside>

                {/* Mobile filter drawer */}
                {showFilters && (
                    <>
                        <div onClick={() => setShowFilters(false)} className="fixed inset-0 bg-black/40 z-60 md:hidden" />
                        <div className="fixed inset-y-0 left-0 z-70 w-[82%] max-w-xs bg-background p-6 overflow-y-auto md:hidden">
                            <div className="flex items-center justify-between mb-5">
                                <span className="font-bold text-lg text-text-hover">Filters</span>
                                <button onClick={() => setShowFilters(false)} aria-label="Close filters" className="text-2xl text-text leading-none">×</button>
                            </div>
                            <div className="flex flex-col gap-6.5">{filterPanel}</div>
                        </div>
                    </>
                )}

                {/* Results */}
                <div>
                    <button
                        onClick={() => setShowFilters(true)}
                        className="md:hidden mb-4 flex items-center gap-2 rounded-full border border-primary-hover px-4 py-2 text-sm font-semibold text-text-hover"
                    >
                        ⚙ Filters
                    </button>
                    <div className="flex justify-between items-center gap-4 mb-5 flex-wrap">
                        <div className="text-base text-text">
                            {textSearch ? `Search results for "${textSearch}" — ` : ''}
                            {products.length}{totalPage > 1 && !loading ? '+' : ''} product{products.length === 1 ? '' : 's'}
                        </div>
                        <div className="flex gap-2 items-center flex-wrap">
                            <span className="text-sm text-text">Sort</span>
                            {SORTS.map((s) => {
                                const on = activeSort.value === s.value;
                                return (
                                    <button
                                        key={s.value}
                                        onClick={() => updateFilters({ sort: s.value })}
                                        className={`rounded-full px-3.5 py-1.5 text-sm font-semibold border transition-colors ${on ? 'bg-secondary text-background border-secondary' : 'bg-transparent text-text border-primary-hover'}`}
                                    >
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <InfiniteScroll
                        dataLength={products.length}
                        next={handleFetchMore}
                        hasMore={hasMore}
                        loader={<div className="text-center py-4 text-text">Loading more products…</div>}
                        endMessage={products.length > 0 ? <div className="text-center py-4 text-text">No more products</div> : null}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {loading && page === 1
                                ? loadingArrayCard.map((_, idx) => (
                                    <div key={idx} className="rounded-2xl overflow-hidden animate-pulse bg-white border border-primary-hover">
                                        <div className="h-47.5 bg-secondary-light" />
                                        <div className="p-5 flex flex-col gap-2.5">
                                            <div className="h-4 rounded w-1/2 bg-secondary-light" />
                                            <div className="h-5 rounded w-3/4 bg-secondary-light" />
                                            <div className="h-4 rounded w-1/3 bg-secondary-light" />
                                        </div>
                                    </div>
                                ))
                                : products.map((product) => {
                                    const url = `/product/${validURLConvert(product.title)}_${product.id}`;
                                    const discount = Number(product.discount ?? 0);
                                    const finalPrice = getDisplayPrice(product);
                                    const hasDiscount = discount > 0;
                                    const chip = product.absorbency || product.category?.title;
                                    return (
                                        <div
                                            key={product.id}
                                            className="flex flex-col bg-white rounded-2xl overflow-hidden border border-primary-hover transition-transform hover:-translate-y-1 hover:shadow-xl"
                                        >
                                            {/* Image and title are their own links; AddToCartButton stays
                                                outside any <a> since it renders its own <button>s and
                                                interactive content can't nest inside interactive content. */}
                                            <Link href={url} className="relative w-full h-47.5 flex items-center justify-center overflow-hidden bg-white border-b border-primary-hover">
                                                <img
                                                    src={product.images?.[0]}
                                                    alt={product.title}
                                                    className="max-w-[86%] max-h-[88%] object-contain"
                                                />
                                                {(hasDiscount || product.isFeatured) && (
                                                    <span className={`absolute top-3 left-3 text-background text-xs font-semibold rounded-full px-3 py-1 ${hasDiscount ? 'bg-[#d9772e]' : 'bg-secondary'}`}>
                                                        {hasDiscount ? `Save ${discount}%` : 'Bestseller'}
                                                    </span>
                                                )}
                                                <span className="absolute bottom-2.5 right-3 text-xs font-semibold rounded-full px-3 py-1 bg-white/94 text-secondary">
                                                    View details →
                                                </span>
                                            </Link>
                                            <div className="p-5 flex flex-col flex-1">
                                                {chip && (
                                                    <span className="self-start bg-secondary-light text-secondary line-clamp-1 font-semibold rounded-full px-3 py-1 text-sm">
                                                        {chip}
                                                    </span>
                                                )}
                                                <Link href={url} className="font-secondary text-xl line-clamp-1 leading-tight text-text-hover mt-2.5 mb-1">
                                                    {product.title}
                                                </Link>
                                                {product.sizes && product.sizes.length > 0 && (
                                                    <span className="text-sm text-text mb-1">
                                                        {product.sizes.length > 1 ? `Sizes ${product.sizes.join(', ')}` : product.sizes[0]}
                                                    </span>
                                                )}
                                                {product.stock === 0 && (
                                                    <span className="text-sm font-semibold text-red-600">Out of stock</span>
                                                )}
                                                <div className="flex justify-between items-end mt-auto pt-3">
                                                    <div>
                                                        <b className="text-xl text-text-hover">{DisplayPriceInAud(finalPrice)}</b>
                                                        {/* {hasDiscount && (
                                                            <div className="text-sm line-through text-text">
                                                                {DisplayPriceInAud(Number(product.price ?? 0))}
                                                            </div>
                                                        )} */}
                                                        {product.pack && (
                                                            <div className="text-sm text-text">{product.pack}</div>
                                                        )}
                                                    </div>
                                                    <AddToCartButton data={product} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </InfiniteScroll>

                    {!loading && products.length === 0 && (
                        <div className="text-center py-16 px-5 text-text">
                            <div className="text-4xl mb-3">◌</div>
                            <div className="font-secondary text-2xl text-text-hover mb-1.5">
                                Nothing matches those filters
                            </div>
                            <div className="text-lg">Try clearing your filters, or ask our assistant.</div>
                            <button
                                onClick={clearFilters}
                                className="mt-5 rounded-full px-7 py-3 font-semibold text-background bg-secondary hover:bg-secondary-hover transition-colors"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {faqs.length > 0 && (
                <section className="max-w-310 mx-auto px-5 sm:px-7 pb-16">
                    <div className="border-t border-primary-hover pt-10">
                        <h2 className="font-secondary text-2xl text-text-hover mb-5">Frequently asked questions</h2>
                        <FaqAccordion faqs={faqs} />
                    </div>
                </section>
            )}
        </div>
    );
};

const ProductsPage = () => {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader /></div>}>
            <ProductsContent />
        </Suspense>
    );
};

export default ProductsPage;
