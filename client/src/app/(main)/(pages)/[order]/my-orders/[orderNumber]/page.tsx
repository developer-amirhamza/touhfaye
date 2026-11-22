"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchMyOrderByNumber, clearCurrentOrder } from "@/redux/slices/orderSlice";
import { DisplayPriceInBdt } from "@/utils/DisplayPriceInBdt";
import {
    ORDER_STATUS_STEPS,
    CANCELLED_STATUS,
    orderStatusLabel,
    orderStatusStepIndex,
    statusReachedAt,
} from "@/app/common/orderStatus";
import { format } from "date-fns";
import Loader from "@/app/(main)/components/UI/Loader";

const OrderTrackingPage = () => {
    const params = useParams();
    const orderNumber = (Array.isArray(params.orderNumber) ? params.orderNumber[0] : params.orderNumber) as string;
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { currentOrder: order, currentOrderStatus, currentOrderError } = useSelector(
        (state: RootState) => state.orderSlice
    );
    const { user, status: authStatus } = useSelector((state: RootState) => state.userSlice);

    useEffect(() => {
        if (authStatus === "succeeded" && !user) {
            router.push("/signin?redirect=/orders");
        }
    }, [authStatus, user, router]);

    useEffect(() => {
        if (user && orderNumber) {
            dispatch(fetchMyOrderByNumber(orderNumber));
        }
        return () => {
            dispatch(clearCurrentOrder());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, orderNumber]);

    if (currentOrderStatus === "loading" || currentOrderStatus === "idle") {
        return (
            <div className="bg-background flex justify-center items-center min-h-[60vh]">
                <Loader />
            </div>
        );
    }

    if (currentOrderError || !order) {
        return (
            <div className="bg-background text-center py-24">
                <p className="text-red-600 font-light">{currentOrderError || "Order not found."}</p>
                <Link href="/order/my-orders" className="text-secondary font-medium underline mt-2 inline-block">
                    Back to your orders
                </Link>
            </div>
        );
    }

    const isCancelled = order.orderStatus === CANCELLED_STATUS;
    const currentStepIndex = orderStatusStepIndex(order.orderStatus);

    return (
        <div className="bg-background min-h-screen py-10">
            <div className="container mx-auto px-6 max-w-[760px]">
                <Link href="/order/my-orders" className="text-[11px] tracking-[.18em] text-accent">
                    ← YOUR ORDERS
                </Link>

                <p className="text-[11px] tracking-[.2em] text-accent mt-5">ORDER {order.orderNumber}</p>
                <h1 className="font-secondary text-4xl text-title mt-2">
                    {isCancelled ? "Order cancelled" : orderStatusLabel(order.orderStatus)}
                </h1>
                <p className="text-sm text-foreground font-light mt-2">
                    Placed {format(new Date(order.createdAt), "dd MMM yyyy, h:mm a")}
                </p>

                {/* Timeline — a cancelled order shows only the steps it actually
                    reached before cancellation, plus a final red "Cancelled" row,
                    rather than greying out steps that will now never happen. */}
                <div className="mt-9 flex flex-col">
                    {ORDER_STATUS_STEPS.filter((_, idx) => !isCancelled || idx <= Math.max(currentStepIndex, 0)).map((step, idx, arr) => {
                        const reached = !isCancelled && idx <= currentStepIndex;
                        const at = statusReachedAt(order.statusHistory, step.value, order.createdAt);
                        const isLast = idx === arr.length - 1 && !isCancelled;
                        return (
                            <div key={step.value} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <span
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                                            reached || isCancelled ? "bg-secondary text-background" : "bg-primary text-accent"
                                        }`}
                                    >
                                        {reached || isCancelled ? "✓" : "•"}
                                    </span>
                                    {!isLast && <span className="w-0.5 flex-1 min-h-8 bg-secondary" />}
                                </div>
                                <div className="pb-8">
                                    <p className={`text-[15px] ${reached || isCancelled ? "text-title font-medium" : "text-foreground font-light"}`}>
                                        {step.label}
                                    </p>
                                    {at && (
                                        <p className="text-[12.5px] text-accent font-light mt-0.5">
                                            {format(new Date(at), "dd MMM yyyy, h:mm a")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {isCancelled && (
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 bg-red-600 text-white">
                                    ✕
                                </span>
                            </div>
                            <div className="pb-2">
                                <p className="text-[15px] text-red-600 font-medium">Order cancelled</p>
                                {statusReachedAt(order.statusHistory, CANCELLED_STATUS, order.createdAt) && (
                                    <p className="text-[12.5px] text-accent font-light mt-0.5">
                                        {format(new Date(statusReachedAt(order.statusHistory, CANCELLED_STATUS, order.createdAt) as string), "dd MMM yyyy, h:mm a")}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Courier tracking */}
                <div className="mt-2 border border-primary-hover bg-white p-5">
                    <h3 className="text-[11px] tracking-[.18em] text-accent mb-3">COURIER</h3>
                    {order.courierTrackingLink ? (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-paragraph font-light">
                                {order.courierName ? `Shipped via ${order.courierName}.` : "Your parcel is on its way."}
                            </p>
                            <a
                                href={order.courierTrackingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-secondary hover:bg-secondary-hover text-background px-5 py-2.5 text-[11px] tracking-[.18em] transition-colors shrink-0"
                            >
                                TRACK WITH COURIER →
                            </a>
                        </div>
                    ) : (
                        <p className="text-sm text-foreground font-light">
                            Courier tracking will appear here once your order is dispatched.
                        </p>
                    )}
                </div>

                {/* Items */}
                <div className="mt-8 border-t border-primary-hover pt-6">
                    <h3 className="text-[11px] tracking-[.18em] text-accent mb-3">IN THIS ORDER</h3>
                    <div className="flex flex-col gap-3">
                        {order.items.map((item) => {
                            const options = [item.swatchLabel, item.variantLabel].filter(Boolean).join(" · ");
                            return (
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
                                        {options && (
                                            <p className="text-[12px] text-accent font-light mt-0.5">{options}</p>
                                        )}
                                        <p className="text-[12.5px] text-foreground font-light mt-1">
                                            Qty {item.quantity} × {DisplayPriceInBdt(item.price)}
                                        </p>
                                    </div>
                                    <p className="text-[14px] text-title whitespace-nowrap">{DisplayPriceInBdt(item.total)}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-5 pt-4 border-t border-primary-hover flex flex-col items-end gap-1">
                        <p className="text-[13px] text-foreground font-light">Subtotal: {DisplayPriceInBdt(order.subtotal)}</p>
                        <p className="font-secondary text-xl text-title">Total: {DisplayPriceInBdt(order.total)}</p>
                        <p className="text-[12px] text-accent font-light">Payment: {order.paymentMethod} · Status: {order.paymentStatus}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTrackingPage;
