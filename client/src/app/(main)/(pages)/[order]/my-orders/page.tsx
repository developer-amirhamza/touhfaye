"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchMyOrders } from "@/redux/slices/orderSlice";
import { DisplayPriceInBdt } from "@/utils/DisplayPriceInBdt";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Loader from "@/app/(main)/components/UI/Loader";

const statusStyle = (status: string) => {
    if (status === "Delivered") return "bg-secondary-light text-secondary";
    if (status === "Cancelled") return "bg-red-100 text-red-700";
    return "bg-primary text-accent";
};

const MyOrdersPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { orders, status, error } = useSelector((state: RootState) => state.orderSlice);
    const { user, status: authStatus } = useSelector((state: RootState) => state.userSlice);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    useEffect(() => {
        if (authStatus === "succeeded" && !user) {
            router.push("/signin?redirect=/orders");
        }
    }, [authStatus, user, router]);

    useEffect(() => {
        if (user && status === "idle") {
            dispatch(fetchMyOrders());
        }
    }, [user, status, dispatch]);

    const toggleOrderDetails = (orderId: string) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    if (status === "loading") {
        return (
            <div className="bg-background flex justify-center items-center min-h-[60vh]">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-background text-center py-24">
                <p className="text-red-600 font-light">Failed to load orders: {error}</p>
                <button
                    onClick={() => dispatch(fetchMyOrders())}
                    className="mt-4 bg-secondary hover:bg-secondary-hover text-background px-6 py-3 text-[11px] tracking-[.18em] transition-colors"
                >
                    TRY AGAIN
                </button>
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="bg-background text-center py-24">
                <p className="text-foreground font-light">You haven&apos;t placed any orders yet.</p>
                <a href="/products" className="text-secondary font-medium underline mt-2 inline-block">Start shopping</a>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen py-10">
            <div className="container mx-auto px-6">
                <h1 className="font-secondary text-4xl text-title mb-8">Your orders</h1>
                <div className="flex flex-col gap-4">
                    {orders.map((order: any) => (
                        <div key={order.id} className="border border-primary-hover bg-white overflow-hidden">
                            <div
                                className="p-5 bg-primary cursor-pointer hover:bg-primary-hover transition-colors flex flex-wrap items-center justify-between gap-3"
                                onClick={() => toggleOrderDetails(order.id)}
                            >
                                <div>
                                    <p className="font-secondary text-lg text-title">{order.orderNumber}</p>
                                    <p className="text-[12.5px] text-accent font-light mt-0.5">
                                        {format(new Date(order.createdAt), "dd MMM yyyy, h:mm a")}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-title font-medium">{DisplayPriceInBdt(order.total)}</p>
                                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full inline-block mt-1 ${statusStyle(order.orderStatus)}`}>
                                        {order.orderStatus}
                                    </span>
                                </div>
                            </div>

                            {expandedOrder === order.id && (
                                <div className="p-5 border-t border-primary-hover">
                                    <div className="mb-5">
                                        <h3 className="text-[11px] tracking-[.18em] text-accent mb-2">DELIVERY</h3>
                                        <p className="text-sm text-paragraph font-light">{order.email} · {order.phone}</p>
                                        <p className="text-sm text-paragraph font-light">{order.shippingAddress}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-[11px] tracking-[.18em] text-accent mb-3">ITEMS</h3>
                                        <div className="flex flex-col gap-3">
                                            {order.items.map((item: any) => (
                                                <div key={item.id} className="flex gap-3 border-b border-primary-hover pb-3 last:border-0">
                                                    {item.productImage && (
                                                        <img
                                                            src={item.productImage}
                                                            alt={item.productName}
                                                            className="w-16 h-16 object-cover flex-none bg-primary"
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="text-[14px] text-title">{item.productName}</p>
                                                        <p className="text-[12.5px] text-foreground font-light mt-1">
                                                            Qty {item.quantity} × {DisplayPriceInBdt(item.price)}
                                                        </p>
                                                    </div>
                                                    <p className="text-[14px] text-title whitespace-nowrap">{DisplayPriceInBdt(item.total)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-5 pt-4 border-t border-primary-hover flex flex-col items-end gap-1">
                                        <p className="text-[13px] text-foreground font-light">Subtotal: {DisplayPriceInBdt(order.subtotal)}</p>
                                        <p className="font-secondary text-xl text-title">Total: {DisplayPriceInBdt(order.total)}</p>
                                        <p className="text-[12px] text-accent font-light">Payment: {order.paymentMethod} · Status: {order.paymentStatus}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyOrdersPage;
