"use client";
import React, { useEffect } from 'react';
import { IoClose } from "react-icons/io5";
import Link from 'next/link';
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud';
import { FaAngleDoubleRight } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import AddToCartButton from './UI/AddToCartBtn';
import emptyCart from "@/assets/empty-cart.gif";
import Image from 'next/image';
import { AppDispatch, RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import { fetchCart } from '@/redux/slices/cartSlice';
import { planForDays } from '@/config/subscriptionPlans';
import { motion } from 'framer-motion';

interface Type {
    close: any;
}

const CartMenu: React.FC<Type> = ({ close }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { cart, status } = useSelector((state: RootState) => state.cartSlice);
    const user = useSelector((state: RootState) => state.userSlice);
    const router = useRouter();

    useEffect(() => {
        if (status === "idle") {
            dispatch(fetchCart());
        }
    }, [status, dispatch]);

    const redirectToCheckoutPage = () => {
        if (user) {
            router.push("/checkout");
            if (close) close();
        }
    };

    // Calculate totals
    let subtotal = 0;
    let totalQty = 0;
    let totalDiscount = 0;
    let grandTotal = 0;

    if (cart?.items?.length) {
        for (const item of cart.items) {
            // displayPrice is already the buyer's own role price (or the
            // main price minus its retail discount) — only the "Subscribe &
            // Save" interval discount still needs applying on top of it here.
            const price = (item as any).displayPrice ?? item.product.price;
            const subscriptionPlan = planForDays((item as any).subscriptionIntervalDays);
            const effectivePct = subscriptionPlan ? subscriptionPlan.discountPct : 0;
            const discountedPrice = price - (price * effectivePct) / 100;
            const itemTotal = discountedPrice * item.quantity;
            const itemOriginalTotal = price * item.quantity;
            subtotal += itemOriginalTotal;
            totalQty += item.quantity;
            totalDiscount += itemOriginalTotal - itemTotal;
            grandTotal += itemTotal;
        }
    }

    return (
        <motion.section onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-neutral-900/90 top-0 z-1000 fixed bottom-0 left-0 right-0">
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="bg-primary w-full max-w-sm h-screen ml-auto flex flex-col">
                <div className="px-3 py-2 shadow-md flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-title">Your Cart</h2>
                    {/* <Link href="/" className="text-2xl lg:hidden hover:bg-orange-600 border p-0.5 rounded hover:text-white text-neutral-700">
                        <IoClose />
                    </Link> */}
                    <div
                        onClick={close}
                        className="text-2xl block hover:bg-primary-hover border p-0.5 rounded hover:text-paragraph text-title"
                    >
                        <IoClose />
                    </div>
                </div>

                <div className="flex-1 overflow-y-scroll flex flex-col px-2">
                    {cart?.items?.[0] ? (
                        <div>
                            <div className="flex items-center justify-between px-4 py-2 mt-2 bg-primary-hover rounded-full text-sm text-title font-semibold">
                                <p>Your total savings</p>
                                <p>{DisplayPriceInAud(totalDiscount)}</p>
                            </div>
                            <div className="grid gap-4 overflow-y-auto p-4 flex-1">
                                {cart?.items?.map((item: any) => (
                                    <div key={item.id} className="flex w-full gap-2 bg-white rounded border-primary-hover items-center px-2 Border border justify-between">
                                        <div className="min-w-16 max-w-16 h-16 ">
                                            <img
                                                className="object-scale-down rounded-md"
                                                src={item.product?.images?.[0] || "/placeholder.png"}
                                                alt={item.product.title}
                                            />
                                        </div>
                                        <div className="w-full text-xs max-w-sm">
                                            <p className="text-ellipsis text-title line-clamp-2">{item.product.title}</p>
                                            <p className="text-paragraph">{item.product.unit}</p>
                                            <p className="font-semibold text-paragraph">
                                                {DisplayPriceInAud(
                                                    (() => {
                                                        const price = (item as any).displayPrice ?? item.product.price;
                                                        const plan = planForDays((item as any).subscriptionIntervalDays);
                                                        const pct = plan ? plan.discountPct : 0;
                                                        return price - (price * pct) / 100;
                                                    })()
                                                )}
                                            </p>
                                            {(item as any).subscriptionIntervalDays && (
                                                <span className="inline-block mt-1 text-[10px] font-medium text-title bg-blue-100 px-1.5 py-0.5 rounded-full">
                                                    Subscribed
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <AddToCartButton data={item.product} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-full flex-col items-center justify-center h-full">
                            <Image src={emptyCart} className="object-scale-down" alt="empty-cart" />
                            <Link
                                href="/"
                                onClick={close}
                                className="bg-green-600 py-1 px-2 rounded text-white cursor-pointer font-semibold text-xl"
                            >
                                Shop Now
                            </Link>
                        </div>
                    )}
                </div>
                {cart?.items?.[0] && (
                    <div className="flex flex-col bg-primary-hover border-t-2 border-primary-hover  mx-auto mt-auto w-full">
                        <div className="grid px-4 py-1  rounded">
                            <h1 className="font-semibold text-title">Bill Details</h1>
                            <div className="flex items-center justify-between font-semibold">
                                <p className="text-paragraph text-sm">Sub Total:</p>
                                <p className="text-paragraph text-sm">{DisplayPriceInAud(subtotal)}</p>
                            </div>
                            <div className="flex items-center justify-between font-semibold">
                                <p className="text-paragraph text-sm">Discount:</p>
                                <p className="text-paragraph text-sm line-through">
                                    {DisplayPriceInAud(totalDiscount)}
                                </p>
                            </div>
                            <div className="flex items-center justify-between font-semibold">
                                <p className="text-paragraph text-sm">Total Quantity:</p>
                                <p className="text-paragraph text-sm">{totalQty} Items</p>
                            </div>
                            <div className="flex items-center justify-between font-semibold">
                                <p className="text-title">Grand Total:</p>
                                <p className="text-title">{DisplayPriceInAud(grandTotal)}</p>
                            </div>
                        </div>


                        <div onClick={redirectToCheckoutPage} className="flex cursor-pointer  items-center mx-auto rounded-full px-4 justify-center max-w-max gap-5 text-neutral-100 bg-secondary-hover py-3 ">
                            <div
                                className="flex items-center  justify-center gap-2"
                            >
                                <button className="cursor-pointer">Checkout:</button>
                                <div>{DisplayPriceInAud(grandTotal)}</div>
                            </div>


                        </div>
                        <div className="text-paragraph mx-auto text-base py-2">
                            📦 Ships discreetly · secure payment
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.section>
    );
};

export default CartMenu;