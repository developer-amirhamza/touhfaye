"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import AxiosToastError from '@/utils/AxiosToastError';
import { SummeryApi } from '@/app/common/SummeryApi';
import { DisplayPriceInBdt } from '@/utils/DisplayPriceInBdt';
import { getDisplayPrice } from '@/utils/PriceWithDiscount';
import { validURLConvert } from '@/utils/validURLConvart';
import StarRating from '@/utils/StartRating';
import { fetchProductReviews, addReview, updateReview, deleteReview } from '@/redux/slices/reviewSlice';
import { RootState, AppDispatch } from '@/redux/store';
import FavoriteButton from '@/app/(main)/components/UI/FavoriteButton';
import FaqAccordion, { FaqItem } from '@/app/(main)/components/UI/FaqAccordion';
import { addToCart } from '@/redux/slices/cartSlice';

// Standing gifting-policy accordion, shown on every product — not fetched,
// since it's the same store-wide info the mockup's "Shipping" / "Returns" /
// "Gift wrap" accordion rows describe.
const INFO_ACCORDION: FaqItem[] = [
    {
        id: 'shipping',
        question: 'Shipping & delivery',
        answer: 'Dhaka: 1–2 business days, ৳60. Outside Dhaka: 2–4 business days, ৳120. Free delivery on orders over ৳1500.',
    },
    {
        id: 'returns',
        question: 'Returns & exchanges',
        answer: 'Unused items can be returned within 7 days of delivery. Send us a photo of the parcel on Messenger and we will arrange a pickup.',
    },
    {
        id: 'giftwrap',
        question: 'Gift wrap & card',
        answer: 'Every order is gift-wrapped at no extra cost and leaves our studio with a handwritten card, ready to hand over as it arrives.',
    },
];

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
    // "" = the product's own base price (no variant picked/needed).
    const [selectedVariantLabel, setSelectedVariantLabel] = useState('');
    const [qty, setQty] = useState(1);
    const [addingToBag, setAddingToBag] = useState(false);

    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [related, setRelated] = useState<any[]>([]);

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
                setSelectedVariantLabel(response.data?.data?.variants?.[0]?.label ?? '');
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

    // "Gifts that go together" — other products in the same category.
    useEffect(() => {
        if (!data.categoryId) return;
        Axios({ ...SummeryApi.searchProduct, params: { category: data.categoryId, limit: 5 } })
            .then((res) => {
                const items = (res.data?.data || []).filter((p: any) => p.id !== productId);
                setRelated(items.slice(0, 4));
            })
            .catch(() => setRelated([]));
    }, [data.categoryId, productId]);

    const handleAddToBag = async () => {
        if (addingToBag) return;
        setAddingToBag(true);
        try {
            const resultAction = await dispatch(addToCart({ productId: data.id, quantity: qty, variantLabel: selectedVariantLabel || undefined }));
            if (addToCart.fulfilled.match(resultAction)) {
                toast.success("Added to bag");
            } else {
                toast.error((resultAction.payload as string) || "Failed to add");
            }
        } finally {
            setAddingToBag(false);
        }
    };

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

    // The selected variant's own price if the product has one matching the
    // current selection, else the product's own discount-adjusted price.
    const activeVariant = data.variants?.find((v: any) => v.label === selectedVariantLabel);
    const finalPrice = activeVariant ? activeVariant.price : getDisplayPrice(data);

    // Specifications are built only from fields that actually have data —
    // nothing here is invented copy, unlike the design mock's fixed rows.
    const specs: { k: string; v: string }[] = [];
    if (data.absorbency) specs.push({ k: "Absorbency", v: data.absorbency });
    if (data.sizes?.length > 0) specs.push({ k: "Sizes", v: data.sizes.join(", ") });
    if (data.pack) specs.push({ k: "Pack", v: data.pack });
    if (data.colors?.length > 0) specs.push({ k: "Colour", v: data.colors.join(", ") });
    specs.push({ k: "Availability", v: data.stock > 0 ? "In stock" : "Out of stock" });

    // Star distribution for the reviews section, computed from the real
    // reviews already loaded — not fabricated placeholder counts.
    const ratingBars = [5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((r) => Math.round(r.rating) === star).length;
        const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
        return { star, count, pct };
    });

    const familyLabel: string = data.subcategory?.title || data.category?.title || '';
    const categoryLabel: string = data.category?.title || 'Shop';

    return (
        <main className="bg-background min-h-screen">
            <div className="max-w-[1240px] mx-auto px-7 pt-7 text-[10.5px] tracking-[.26em] text-accent">
                <Link href="/products" className="cursor-pointer">SHOP</Link>
                {categoryLabel && <> / {categoryLabel.toUpperCase()}</>} / {(data.title || '').toUpperCase()}
            </div>

            <section className="max-w-[1240px] mx-auto px-7 pt-6.5 pb-19 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-12 items-start">
                {/* Gallery */}
                <div className={`grid ${data.images?.length > 1 ? 'grid-cols-[62px_minmax(0,1fr)]' : 'grid-cols-1'} gap-3`}>
                    {data.images?.length > 1 && (
                        <div className="flex flex-col gap-2.5">
                            {data.images.map((img: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setImage(idx)}
                                    aria-label={`Show image ${idx + 1}`}
                                    className={`aspect-square bg-primary bg-cover bg-center overflow-hidden outline-offset-2 ${idx === image ? 'outline outline-2 outline-secondary' : ''}`}
                                    style={{ backgroundImage: `url(${img})` }}
                                />
                            ))}
                        </div>
                    )}
                    <div className="relative aspect-[4/5] bg-primary bg-cover bg-center overflow-hidden">
                        {data.images?.[image] && (
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.images[image]})` }} />
                        )}
                        {data.discount > 0 && (
                            <span className="absolute top-3.5 left-3.5 bg-secondary text-background text-sm font-semibold px-3.5 py-1.5">
                                Save {data.discount}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div>
                    {familyLabel && (
                        <div className="text-[10.5px] tracking-[.24em] text-accent">{familyLabel.toUpperCase()}</div>
                    )}
                    <h1 className="font-secondary text-4xl leading-[1.12] mt-3 text-title font-normal">{data.title}</h1>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
                        className="flex items-center gap-2.5 mt-3.5 cursor-pointer w-fit"
                    >
                        <StarRating rating={averageRating} readOnly size={16} />
                        <span className="text-paragraph text-[13px] font-light">{averageRating.toFixed(1)} · {totalReviews} reviews</span>
                    </div>

                    <div className="flex items-baseline gap-3.5 mt-3.5 flex-wrap">
                        <div className="text-2xl text-title">{DisplayPriceInBdt(finalPrice)}</div>
                        {data.pack && <div className="text-xs text-accent font-light">{data.pack}</div>}
                    </div>
                    {data.pricingNotes && (
                        <p className="text-sm text-paragraph mt-1">{data.pricingNotes}</p>
                    )}

                    {data.description && (
                        <p className="text-[15px] leading-[1.8] text-paragraph font-light max-w-[46ch] mt-5.5">{data.description}</p>
                    )}

                    {data.keyFeatures?.length > 0 && (
                        <div className="flex flex-col gap-2 mt-4">
                            {data.keyFeatures.map((feature: string, idx: number) => (
                                <div key={idx} className="flex gap-2.5 text-[13.5px] text-paragraph font-light leading-snug">
                                    <span className="text-secondary shrink-0">✓</span>
                                    {feature}
                                </div>
                            ))}
                        </div>
                    )}

                    {specs.length > 0 && (
                        <div className="flex gap-6 mt-6.5 py-4.5 border-t border-b border-primary-hover flex-wrap">
                            {specs.map((row) => (
                                <div key={row.k}>
                                    <div className="text-[9.5px] tracking-[.18em] text-accent">{row.k.toUpperCase()}</div>
                                    <div className="text-sm mt-1.5 font-light text-title">{row.v}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {data.variants?.length > 0 ? (
                        <div className="mt-6">
                            <div className="text-[11px] tracking-[.2em] text-title">SIZE</div>
                            <div className="flex gap-2.5 mt-3 flex-wrap">
                                {data.variants.map((variant: any) => (
                                    <button
                                        key={variant.label}
                                        onClick={() => setSelectedVariantLabel(variant.label)}
                                        className={`border px-4.5 py-3 min-w-23 text-left transition-colors ${selectedVariantLabel === variant.label ? 'bg-secondary text-background border-secondary' : 'bg-transparent text-title border-primary-hover hover:border-secondary'}`}
                                    >
                                        <div className="text-[13.5px]">{variant.label}</div>
                                        <div className={`text-[11px] mt-0.5 ${selectedVariantLabel === variant.label ? 'text-background/70' : 'text-accent'}`}>
                                            {DisplayPriceInBdt(variant.price)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : data.sizes?.length > 0 && (
                        <div className="mt-6">
                            <div className="text-[11px] tracking-[.2em] text-title">SIZE</div>
                            <div className="flex gap-2.5 mt-3 flex-wrap">
                                {data.sizes.map((size: string) => (
                                    <div key={size} className="border px-4.5 py-3 min-w-23 text-left bg-transparent text-title border-primary-hover">
                                        <div className="text-[13.5px]">{size}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 mt-6.5 flex-wrap">
                        {data.stock === 0 ? (
                            <p className="text-red-600 font-semibold">Out of stock</p>
                        ) : (
                            <>
                                <div className="flex items-center border border-[#BDB29A]">
                                    <button
                                        type="button"
                                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                                        className="w-10.5 h-12.5 flex items-center justify-center text-paragraph text-base"
                                        aria-label="Decrease quantity"
                                    >
                                        −
                                    </button>
                                    <span className="w-8 text-center text-sm">{qty}</span>
                                    <button
                                        type="button"
                                        onClick={() => setQty((q) => q + 1)}
                                        className="w-10.5 h-12.5 flex items-center justify-center text-paragraph text-base"
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddToBag}
                                    disabled={addingToBag}
                                    className="flex-1 min-w-55 h-12.5 bg-secondary hover:bg-secondary-hover text-background flex items-center justify-center text-[11.5px] tracking-[.18em] transition-colors disabled:opacity-70"
                                >
                                    {addingToBag ? 'ADDING…' : `ADD TO BAG — ${DisplayPriceInBdt(finalPrice * qty)}`}
                                </button>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2.5 text-[12.5px] text-accent font-light mt-3.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                        Gift wrap and handwritten card included · Dispatch in 24 hours
                    </div>

                    <div className="mt-7.5 border-t border-primary-hover pt-5">
                        <FaqAccordion faqs={INFO_ACCORDION} />
                    </div>
                </div>
            </section>

            {/* Trust strip */}
            <section className="bg-secondary text-[#E9DFC6] py-11 px-7">
                <div className="max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-7">
                    {[
                        { title: 'Hand-poured', note: 'SMALL BATCHES' },
                        { title: 'Gift-ready', note: 'WRAP + CARD FREE' },
                        { title: 'Cash on delivery', note: 'NATIONWIDE' },
                        { title: '7-day returns', note: 'UNUSED ITEMS' },
                    ].map((item) => (
                        <div key={item.title}>
                            <div className="font-secondary text-[26px] text-accent-light">{item.title}</div>
                            <div className="text-[11px] tracking-[.18em] mt-2 text-[#A79E85]">{item.note}</div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="max-w-[1240px] mx-auto px-7">
                <div id="reviews" className="mt-14 max-w-3xl scroll-mt-24">
                    <div className="flex items-center gap-9 flex-wrap mb-8">
                        <div>
                            <div className="font-secondary text-5xl leading-none text-title">{averageRating.toFixed(1)}</div>
                            <div className="mt-2"><StarRating rating={averageRating} readOnly size={18} /></div>
                            <div className="text-sm text-paragraph mt-1.5">{totalReviews} verified reviews</div>
                        </div>
                        <div className="flex-1 min-w-60 flex flex-col gap-1.5">
                            {ratingBars.map((b) => (
                                <div key={b.star} className="flex items-center gap-3 text-sm text-paragraph">
                                    <span className="w-12 whitespace-nowrap">{b.star} star</span>
                                    <span className="flex-1 h-2 rounded-full bg-primary-hover overflow-hidden">
                                        <span className="block h-full rounded-full bg-secondary" style={{ width: `${b.pct}%` }} />
                                    </span>
                                    <span className="w-8 text-right">{b.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
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
                </div>

                {faqs.length > 0 && (
                    <div className="border-t border-primary-hover mt-12 pt-8 max-w-3xl">
                        <h2 className="font-secondary text-2xl text-text-hover mb-5">Frequently asked questions</h2>
                        <FaqAccordion faqs={faqs} />
                    </div>
                )}

                {related.length > 0 && (
                    <div className="border-t border-primary-hover mt-14 pt-10 pb-8">
                        <div className="flex justify-between items-baseline gap-5 flex-wrap mb-6">
                            <h2 className="font-secondary text-2xl text-title">Gifts that go together</h2>
                            <Link href="/products" className="text-[11px] tracking-[.16em] border-b border-secondary text-secondary pb-1">
                                VIEW ALL
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {related.map((p: any) => {
                                const rUrl = `/product/${validURLConvert(p.title)}_${p.id}`;
                                return (
                                    <div key={p.id} className="group">
                                        <div className="relative aspect-square bg-primary overflow-hidden">
                                            <Link href={rUrl} className="absolute inset-0">
                                                {p.images?.[0] && (
                                                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                )}
                                            </Link>
                                            <FavoriteButton
                                                product={p}
                                                size={15}
                                                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/94 hover:bg-white flex items-center justify-center text-secondary shadow-sm transition-colors"
                                            />
                                        </div>
                                        <Link href={rUrl} className="flex justify-between gap-3 mt-3 items-baseline">
                                            <span className="font-secondary text-[15px] text-title leading-snug line-clamp-1">{p.title}</span>
                                            <span className="text-[13px] text-paragraph whitespace-nowrap">{DisplayPriceInBdt(getDisplayPrice(p))}</span>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default ProductDetailsPage;
