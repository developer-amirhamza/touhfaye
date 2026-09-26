"use client";
import React, { useEffect } from 'react';
import { IoClose } from "react-icons/io5";
import Link from 'next/link';
import { DisplayPriceInBdt } from '@/utils/DisplayPriceInBdt';
import { FaAngleDoubleRight } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import AddToCartButton from './UI/AddToCartBtn';
import emptyCart from "@/assets/empty-cart.gif";
import Image from 'next/image';
import { AppDispatch, RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import { fetchCart } from '@/redux/slices/cartSlice';
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

    // Calculate totals — displayPrice is the server-resolved unit price for
    // each line (its own variant price, or the product's discount-adjusted
    // main price).
    let totalQty = 0;
    let grandTotal = 0;

    if (cart?.items?.length) {
        for (const item of cart.items) {
            const price = (item as any).displayPrice ?? item.product.price;
            totalQty += item.quantity;
            grandTotal += price * item.quantity;
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
                                            {item.variantLabel && (
                                                <p className="text-paragraph">{item.variantLabel}</p>
                                            )}
                                            <p className="font-semibold text-paragraph">
                                                {DisplayPriceInBdt((item as any).displayPrice ?? item.product.price)}
                                            </p>
                                        </div>
                                        <div>
                                            <AddToCartButton data={item.product} variantLabel={item.variantLabel} />
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
                                className="bg-secondary hover:bg-secondary-hover py-2 px-4 rounded text-background cursor-pointer font-semibold text-xl transition-colors"
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
                                <p className="text-paragraph text-sm">Total Quantity:</p>
                                <p className="text-paragraph text-sm">{totalQty} Items</p>
                            </div>
                            <div className="flex items-center justify-between font-semibold">
                                <p className="text-title">Grand Total:</p>
                                <p className="text-title">{DisplayPriceInBdt(grandTotal)}</p>
                            </div>
                        </div>


                        <div onClick={redirectToCheckoutPage} className="flex cursor-pointer  items-center mx-auto rounded-full px-4 justify-center max-w-max gap-5 text-neutral-100 bg-secondary-hover py-3 ">
                            <div
                                className="flex items-center  justify-center gap-2"
                            >
                                <button className="cursor-pointer">Checkout:</button>
                                <div>{DisplayPriceInBdt(grandTotal)}</div>
                            </div>


                        </div>
                        <div className="text-paragraph mx-auto text-sm py-2 font-light">
                            Gift wrap included · Dhaka in 1–2 days
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.section>
    );
};

export default CartMenu;