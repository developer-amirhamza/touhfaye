"use client";
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { AppDispatch, RootState } from '@/redux/store';
import { addToCart, updateCartItem, deleteCartItem, fetchCart } from '@/redux/slices/cartSlice';
import Loader from './Loader';

interface Type {
    data: any;
    // Which priced option (Product.variants[].label) to add — omit for a
    // plain single-price product, or to quick-add a product with variants
    // at its first/default option (matches the server's own default).
    variantLabel?: string;
    // Full-width outlined style used by the product list grid (matches the
    // design mock's "ADD TO BAG" quick-add strip) instead of the compact
    // pill/stepper used elsewhere (cart drawer, product detail, etc).
    fullWidth?: boolean;
}

const AddToCartButton: React.FC<Type> = ({ data, variantLabel, fullWidth }) => {
    const [loading, setLoading] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [quantity, setQuantity] = useState(0);
    const [cartItemDetails, setCartItemDetails] = useState<any>(null);

    const dispatch = useDispatch<AppDispatch>();
    const { cart, status } = useSelector((state: RootState) => state.cartSlice);

    // A product with variants always has one selected — default to the
    // first, mirroring the server's own default when none is passed.
    const effectiveVariantLabel = variantLabel ?? (data?.variants?.[0]?.label ?? "");

    // Fetch cart on mount if idle
    useEffect(() => {
        if (status === "idle") {
            dispatch(fetchCart());
        }
    }, [status, dispatch]);

    // Update local state when cart changes
    useEffect(() => {
        if (cart?.items?.[0]) {
            const found = cart.items.find(
                (item) => item?.product?.id === data?.id && (item.variantLabel || "") === effectiveVariantLabel
            );
            setIsAvailable(!!found);
            setQuantity(found?.quantity || 0);
            setCartItemDetails(found);
        } else {
            setIsAvailable(false);
            setQuantity(0);
            setCartItemDetails(null);
        }
    }, [cart, data?.id, effectiveVariantLabel]);

    // Add to cart
    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (loading) return;
        setLoading(true);
        try {
            const resultAction = await dispatch(addToCart({ productId: data?.id, quantity: 1, variantLabel: effectiveVariantLabel || undefined }));
            if (addToCart.fulfilled.match(resultAction)) {
                toast.success("Added to bag");
            } else {
                toast.error(resultAction.payload as string || "Failed to add");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // Increase quantity
    const increaseQty = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!cartItemDetails?.id) return;
        const newQty = quantity + 1;
        try {
            const resultAction = await dispatch(updateCartItem({ itemId: cartItemDetails.id, quantity: newQty }));
            if (updateCartItem.fulfilled.match(resultAction)) {
                toast.success("Quantity updated");
            }
        } catch (error) {
            toast.error("Failed to update");
        }
    };

    // Decrease quantity (remove if quantity becomes 0)
    const decreaseQty = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!cartItemDetails?.id) return;
        if (quantity === 1) {
            try {
                const resultAction = await dispatch(deleteCartItem(cartItemDetails.id));
                if (deleteCartItem.fulfilled.match(resultAction)) {
                    toast.success("Item removed");
                }
                dispatch(fetchCart());
            } catch (error) {
                toast.error("Failed to remove");
            }
        } else {
            const newQty = quantity - 1;
            try {
                const resultAction = await dispatch(updateCartItem({ itemId: cartItemDetails.id, quantity: newQty }));
                if (updateCartItem.fulfilled.match(resultAction)) {
                    toast.success("Quantity updated");
                }
            } catch (error) {
                toast.error("Failed to update");
            }
        }
    };

    if (fullWidth) {
        return (
            <div>
                {isAvailable ? (
                    <div className="flex items-center justify-between w-full border border-secondary">
                        <button
                            onClick={decreaseQty}
                            className="w-9 h-9 flex items-center justify-center text-secondary hover:bg-primary transition-colors cursor-pointer"
                        >
                            <FaMinus size={11} />
                        </button>
                        <p className="text-[13.5px] font-medium text-secondary">{quantity}</p>
                        <button
                            onClick={increaseQty}
                            className="w-9 h-9 flex items-center justify-center text-secondary hover:bg-primary transition-colors cursor-pointer"
                        >
                            <FaPlus size={11} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleAddToCart}
                        className="w-full border border-secondary text-secondary uppercase text-[11px] tracking-[.16em] py-2.75 hover:bg-secondary hover:text-background transition-colors cursor-pointer disabled:opacity-60"
                        disabled={loading}
                    >
                        {loading ? <Loader className="max-h-5 max-w-5 mx-auto" /> : "Add to bag"}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div>
            {isAvailable ? (
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={decreaseQty}
                        className="text-white bg-secondary  cursor-pointer rounded-sm py-1 px-1"
                    >
                        <FaMinus  />
                    </button>
                    <p className="mx-1 font-semibold text-neutral-700 min-w-6 text-center">{quantity}</p>
                    <button
                        onClick={increaseQty}
                        className="text-white bg-secondary  cursor-pointer rounded-sm py-1 px-1"
                    >
                        <FaPlus />
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleAddToCart}
                    className="px-2 py-1 rounded text-white font-medium bg-secondary "
                    disabled={loading}
                >
                    {loading ? <Loader className="max-h-5 max-w-5" /> : "Add"}
                </button>
            )}
        </div>
    );
};

export default AddToCartButton;
