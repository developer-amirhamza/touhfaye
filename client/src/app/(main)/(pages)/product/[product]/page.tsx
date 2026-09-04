"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import AxiosToastError from '@/utils/AxiosToastError';
import { SummeryApi } from '@/app/common/SummeryApi';
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud';
import { getDisplayPrice } from '@/utils/PriceWithDiscount';
import StarRating from '@/utils/StartRating';
import { fetchProductReviews, addReview, updateReview, deleteReview } from '@/redux/slices/reviewSlice';
import { RootState, AppDispatch } from '@/redux/store';
import AddToCartButton from '@/app/(main)/components/UI/AddToCartBtn';
import Breadcrumb from '@/app/(main)/components/UI/Breadcrumb';
import SizeFinder from '@/app/(main)/components/SizeFinder';
import FaqAccordion, { FaqItem } from '@/app/(main)/components/UI/FaqAccordion';

type Tab = 'details' | 'reviews';

const ProductDetailsPage = () => {
    const params = useParams();
    const productSlug = params.product;
    const productId = (Array.isArray(productSlug) ? productSlug[0] : productSlug)?.split("_")?.slice(-1)[0];

    const [data, setData] = useState<any>({
        title: "",
        images: [],
        price: 0,
        discount: 0,
        description: "",
        more_details: {},
        stock: 0,
    });
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(0);
    const [tab, setTab] = useState<Tab>('details');
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    const [faqs, setFaqs] = useState<FaqItem[]>([]);

    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editRating, setEditRating] = useState(0);
    const [editComment, setEditComment] = useState("");

    const dispatch = useDispatch<AppDispatch>();
    const user = useSelector((state: RootState) => state.userSlice?.user);
    const { reviews, averageRating, totalReviews, status: reviewStatus } = useSelector((state: RootState) => state.reviewSlice);

    const fetchProductDetails = async (id: string) => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await Axios({
                ...SummeryApi.fetchProductDetails,
                data: { id },
            });
            if (response.data?.success) {
                setData(response.data?.data);
                setSelectedSize(response.data?.data?.sizes?.[0] ?? null);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (productId) {
            fetchProductDetails(productId);
            dispatch(fetchProductReviews(productId));
        }
    }, [productId, dispatch]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, []);

    useEffect(() => {
        if (!productId) return;
        Axios({ ...SummeryApi.getFaqs, params: { surface: "PRODUCT_PAGE", productId } })
            .then((res) => {
                if (res.data?.success) setFaqs(res.data.data);
            })
            .catch(() => { /* embedded FAQs are optional — fail silently */ });
    }, [productId]);

    const handleAddReview = async () => {
        if (!user) {
            toast.error("Please login to write a review");
            return;
        }
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }
        if (!reviewComment.trim()) {
            toast.error("Please write a comment");
            return;
        }
        await dispatch(addReview({ productId: productId!, rating, comment: reviewComment }));
        setRating(0);
        setReviewComment("");
    };

    const startEdit = (review: any) => {
        setEditingReviewId(review.id);
        setEditRating(review.rating);
        setEditComment(review.comment || "");
    };

    const cancelEdit = () => {
        setEditingReviewId(null);
        setEditRating(0);
        setEditComment("");
    };

    const handleUpdateReview = async (reviewId: string) => {
        if (editRating === 0) {
            toast.error("Please select a rating");
            return;
        }
        if (!editComment.trim()) {
            toast.error("Please write a comment");
            return;
        }
        await dispatch(updateReview({ reviewId, rating: editRating, comment: editComment }));
        cancelEdit();
    };

    const handleDeleteReview = async (reviewId: string) => {
        if (window.confirm("Are you sure you want to delete this review?")) {
            await dispatch(deleteReview(reviewId));
        }
    };

    if (loading) {
        return <div className="container mx-auto p-4">Loading...</div>;
    }

    const finalPrice = getDisplayPrice(data);

    // Specifications are built only from fields that actually have data —
    // nothing here is invented copy, unlike the design mock's fixed rows.
    const specs: { k: string; v: string }[] = [];
    if (data.absorbency) specs.push({ k: "Absorbency", v: data.absorbency });
    if (data.sizes?.length > 0) specs.push({ k: "Sizes", v: data.sizes.join(", ") });
    if (data.pack) specs.push({ k: "Pack", v: data.pack });
    if (data.colors?.length > 0) specs.push({ k: "Colour", v: data.colors.join(", ") });
    specs.push({ k: "Availability", v: data.stock > 0 ? "In stock" : "Out of stock" });

    // Star distribution for the reviews tab, computed from the real reviews
    // already loaded — not fabricated placeholder counts.
    const ratingBars = [5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((r) => Math.round(r.rating) === star).length;
        const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
        return { star, count, pct };
    });

    return (
        <main className="bg-background min-h-screen pb-28">
            <div className="container mx-auto px-6 py-8">
                <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/products' }, { label: data.title || '...' }]} />

                <div className="grid lg:grid-cols-2 gap-10 mt-6">
                    {/* Left column — gallery */}
                    <div>
                        <div className="relative h-82.5 md:h-105 bg-white rounded-2xl border border-primary-hover flex items-center justify-center overflow-hidden">
                            {data.images?.[image] ? (
                                <img className="max-w-[86%] max-h-[88%] object-contain" src={data.images[image]} alt={data.title} />
                            ) : (
                                <div className="text-center text-text">
                                    <div className="text-4xl mb-2">▢</div>
                                    <div className="text-sm tracking-wide">Photo to come</div>
                                </div>
                            )}
                            <span className="absolute top-3.5 left-3.5 bg-secondary text-background text-sm font-semibold rounded-full px-3.5 py-1.5">
                                {data.discount > 0 ? `Save ${data.discount}%` : 'NDIS claimable'}
                            </span>
                        </div>
                        {data.images?.length > 1 && (
                            <div className="grid grid-cols-4 gap-2.5 mt-2.5">
                                {data.images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setImage(idx)}
                                        className={`h-[78px] rounded-lg bg-white flex items-center justify-center overflow-hidden border ${idx === image ? 'border-2 border-secondary' : 'border-primary-hover'}`}
                                    >
                                        <img src={img} className="max-w-[82%] max-h-[84%] object-contain" alt={data.title} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right column — info */}
                    <div>
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>{data.absorbency && (
                                <span className="inline-block bg-secondary-light text-secondary font-semibold rounded-full px-3.5 py-1.5 text-sm">
                                    {data.absorbency}
                                </span>
                            )}</div>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => setTab('details')}
                                    className={`rounded-full px-5 py-2 text-sm font-semibold border transition-colors ${tab === 'details' ? 'bg-secondary text-background border-secondary' : 'bg-transparent text-text border-primary-hover'}`}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setTab('reviews')}
                                    className={`rounded-full px-5 py-2 text-sm font-semibold border transition-colors ${tab === 'reviews' ? 'bg-secondary text-background border-secondary' : 'bg-transparent text-text border-primary-hover'}`}
                                >
                                    Reviews {totalReviews} reviews
                                </button>
                            </div>
                        </div>

                        <h1 className="font-secondary text-3xl md:text-4xl text-text-hover leading-tight mt-3">{data.title}</h1>

                        {tab === 'details' ? (
                            <>
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setTab('reviews')}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setTab('reviews')}
                                    className="flex items-center gap-2.5 mt-4 cursor-pointer w-fit"
                                >
                                    <StarRating rating={averageRating} readOnly size={18} />
                                    <span className="text-text text-sm">{averageRating.toFixed(1)} · {totalReviews} reviews →</span>
                                </div>

                                <div className="flex items-baseline gap-3 mt-4">
                                    <span className="font-primary text-4xl text-text-hover">{DisplayPriceInAud(finalPrice)}</span>
                                    {/* {data.discount > 0 && (
                                        <span className="line-through text-text text-xl">{DisplayPriceInAud(data.price)}</span>
                                    )} */}
                                    {data.pack && <span className="text-text">{data.pack}</span>}
                                </div>
                                {data.pricingNotes && (
                                    <p className="text-sm text-text mt-1">{data.pricingNotes}</p>
                                )}

                                {data.description && (
                                    <p className="text-text leading-relaxed mt-4">{data.description}</p>
                                )}

                                {data.sizes?.length > 0 && (
                                    <div className="mt-5">
                                        <p className="text-sm font-semibold text-text-hover mb-2">Size</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {data.sizes.map((size: string) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`rounded-lg px-4 py-2 text-sm font-semibold border transition-colors min-w-15 ${selectedSize === size ? 'bg-secondary text-background border-secondary' : 'bg-white text-text-hover border-primary-hover hover:border-secondary'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6">
                                    {data.stock === 0 ? (
                                        <p className="text-red-600 font-semibold">Out of stock</p>
                                    ) : (
                                        <AddToCartButton data={data} />
                                    )}
                                </div>

                                {/* <div className="flex flex-col gap-2 mt-6 text-sm text-text">
                                    <div>📦 Ships in plain, unmarked packaging</div>
                                    <div>🚚 Free delivery on orders over $99</div>
                                    <div>✚ Claimable on NDIS and Support at Home</div>
                                </div> */}
                            </>
                        ) : (
                            <div className="mt-5">
                                <div className="flex gap-9 items-center flex-wrap">
                                    <div>
                                        <div className="font-secondary text-5xl leading-none text-text-hover">{averageRating.toFixed(1)}</div>
                                        <div className="mt-1"><StarRating rating={averageRating} readOnly size={20} /></div>
                                        <div className="text-sm text-text mt-1.5">{totalReviews} verified reviews</div>
                                    </div>
                                    <div className="flex-1 min-w-60 flex flex-col gap-1.5">
                                        {ratingBars.map((b) => (
                                            <div key={b.star} className="flex items-center gap-3 text-sm text-text">
                                                <span className="w-12 whitespace-nowrap">{b.star} star</span>
                                                <span className="flex-1 h-2 rounded-full bg-primary-hover overflow-hidden">
                                                    <span className="block h-full rounded-full bg-secondary" style={{ width: `${b.pct}%` }} />
                                                </span>
                                                <span className="w-8 text-right">{b.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {tab === 'details' && (data.keyFeatures?.length > 0 || specs.length > 0) && (
                    <div className="grid md:grid-cols-2 gap-1">
                        {data.keyFeatures?.length > 0 && (
                            <div>
                                <h2 className="font-secondary text-2xl text-text-hover mb-3">What makes it work</h2>
                                <div className="flex flex-col gap-2.5">
                                    {data.keyFeatures.map((feature: string, idx: number) => (
                                        <div key={idx} className="flex gap-2.5 text-text leading-snug">
                                            <span className="text-secondary shrink-0">✓</span>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {specs.length > 0 && (
                            <div>
                                <h2 className="font-secondary text-2xl text-text-hover mb-3">Specifications</h2>
                                <div className="flex flex-col">
                                    {specs.map((row) => (
                                        <div key={row.k} className="flex gap-4 py-2.5 border-b border-primary-hover">
                                            <span className="w-28 shrink-0 text-text">{row.k}</span>
                                            <span className="text-text-hover">{row.v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'details' && (
                    <div id="size-guide" className="mt-14 scroll-mt-24">
                        <SizeFinder product={data} />
                    </div>
                )}

                {tab === 'reviews' && (
                    <div className="mt-10 max-w-3xl">
                        {user ? (
                            <div className="bg-white border border-primary-hover rounded-2xl p-6 mb-6">
                                <h3 className="font-semibold text-text-hover mb-3">{editingReviewId ? "Edit your review" : "Write a review"}</h3>
                                <div className="mb-3">
                                    <StarRating
                                        rating={editingReviewId ? editRating : rating}
                                        handleRatingChange={editingReviewId ? setEditRating : setRating}
                                    />
                                </div>
                                <textarea
                                    rows={3}
                                    className="w-full border border-primary-hover rounded-lg p-3 mb-3 outline-none focus:border-secondary"
                                    placeholder="Share your experience with this product..."
                                    value={editingReviewId ? editComment : reviewComment}
                                    onChange={(e) => editingReviewId ? setEditComment(e.target.value) : setReviewComment(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    {editingReviewId ? (
                                        <>
                                            <button onClick={() => handleUpdateReview(editingReviewId)} className="bg-secondary hover:bg-secondary-hover text-background px-4 py-2 rounded-full text-sm font-semibold transition-colors">Update</button>
                                            <button onClick={cancelEdit} className="bg-primary-hover px-4 py-2 rounded-full text-sm font-semibold">Cancel</button>
                                        </>
                                    ) : (
                                        <button onClick={handleAddReview} className="bg-secondary hover:bg-secondary-hover text-background px-5 py-2 rounded-full text-sm font-semibold transition-colors">Submit review</button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-text mb-6">Please <a href="/signin" className="text-secondary font-semibold hover:underline">login</a> to write a review.</p>
                        )}

                        {reviewStatus === 'loading' && <p className="text-text">Loading reviews...</p>}
                        {reviews.length === 0 && reviewStatus !== 'loading' && (
                            <p className="text-text">No reviews yet. Be the first to review!</p>
                        )}

                        <div className="flex flex-col gap-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-white border border-primary-hover rounded-2xl p-5">
                                    <div className="flex justify-between items-start gap-4 flex-wrap">
                                        <div>
                                            <StarRating rating={review.rating} readOnly size={16} />
                                            <p className="text-sm text-text mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        {user && (String(user.id) === review.userId || user.role === 'ADMIN') && !editingReviewId && (
                                            <div className="flex gap-3 text-sm">
                                                <button onClick={() => startEdit(review)} className="text-secondary font-semibold hover:underline">Edit</button>
                                                <button onClick={() => handleDeleteReview(review.id)} className="text-red-600 font-semibold hover:underline">Delete</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <b className="text-text-hover">{review.user.name}</b>
                                    </div>
                                    <p className="text-text leading-relaxed mt-2">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {faqs.length > 0 && (
                    <div className="border-t border-primary-hover mt-12 pt-8 max-w-3xl">
                        <h2 className="font-secondary text-2xl text-text-hover mb-5">Frequently asked questions</h2>
                        <FaqAccordion faqs={faqs} />
                    </div>
                )}
            </div>

            {/* Sticky checkout bar, matching the design's popup footer */}
            <div className="fixed bottom-0 inset-x-0 bg-background border-t border-primary-hover pl-6 pr-24 py-4 flex items-center gap-4 z-30 shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
                <span className="font-secondary text-xl text-text-hover">{DisplayPriceInAud(finalPrice)}</span>
                <span className="text-sm text-text flex-1 hidden sm:block">
                    {data.pack}{selectedSize ? ` · size ${selectedSize}` : ''}
                </span>
                <div className="ml-auto sm:ml-0">
                    {data.stock === 0 ? (
                        <span className="text-red-600 font-semibold text-sm">Out of stock</span>
                    ) : (
                        <AddToCartButton data={data} />
                    )}
                </div>
            </div>
        </main>
    );
};

export default ProductDetailsPage;
