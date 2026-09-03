"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchMyOrders } from "@/redux/slices/orderSlice";
import { DisplayPriceInAud } from "@/utils/DisplayPriceInAud";
import { format } from "date-fns"; // optional, for date formatting
import { useRouter } from "next/navigation";
import Loader from "@/app/(main)/components/UI/Loader";



const MyOrdersPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { orders, status, error } = useSelector((state: RootState) => state.orderSlice);
    const { user, status: authStatus } = useSelector((state: RootState) => state.userSlice);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    // Redirect if not logged in
    useEffect(() => {
        if (authStatus === "succeeded" && !user) {
            router.push("/signin?redirect=/orders");
        }
    }, [authStatus, user, router]);
    console.log(orders, "orders list")
    // Fetch orders when user is authenticated
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
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500">Failed to load orders: {error}</p>
                <button
                    onClick={() => dispatch(fetchMyOrders())}
                    className="mt-4 bg-secondary text-white px-4 py-2 rounded"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-neutral-500 text-lg">You haven't placed any orders yet.</p>
                <a href="/products" className="text-secondary underline mt-2 inline-block">
                    Start Shopping
                </a>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 mb-6 my-12">
            <h1 className="text-2xl font-bold text-neutral-800 mb-6">My Orders</h1>
            <div className="space-y-6">
                {orders.map((order:any) => {
                    return(
                    <div key={order.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
                        {/* Order Header */}
                        <div
                            className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition flex flex-wrap items-center justify-between gap-2"
                            onClick={() => toggleOrderDetails(order.id)}
                        >
                            <div>
                                <p className="font-semibold text-neutral-800">{order.orderNumber}</p>
                                <p className="text-sm text-neutral-500">
                                    {format(new Date(order.createdAt), "dd MMM yyyy, h:mm a")}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-600">{DisplayPriceInAud(order.total)}</p>
                                <p
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${order.orderStatus === "Delivered"
                                            ? "bg-green-100 text-green-700"
                                            : order.orderStatus === "Cancelled"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-yellow-100 text-yellow-700"
                                        }`}
                                >
                                    {order.orderStatus}
                                </p>
                            </div>
                        </div>

                        {/* Order Details (expandable) */}
                        {expandedOrder === order.id && (
                            <div className="p-4 border-t">
                                <div className="mb-4">
                                    <h3 className="font-semibold text-neutral-700 mb-2">Shipping Information</h3>
                                    <p className="text-sm">
                                        <span className="font-medium">Name:</span> {order?.name || "—"}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Email:</span> {order.email}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Phone:</span> {order.phone}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Address:</span> {order.shippingAddress}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-neutral-700 mb-2">Items</h3>
                                    <div className="space-y-3">
                                        {order.items.map((item:any) => (
                                            <div key={item.id} className="flex gap-3 border-b pb-2 last:border-0">
                                                {item.productImage && (
                                                    <img
                                                        src={item.productImage}
                                                        alt={item.productName}
                                                        className="w-16 h-16 object-cover rounded"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.productName}</p>
                                                    <p className="text-sm text-neutral-600">
                                                        Qty: {item.quantity} × {DisplayPriceInAud(item.price)}
                                                    </p>
                                                    <p className="text-sm font-semibold">
                                                        Total: {DisplayPriceInAud(item.total)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-4 pt-2 border-t text-right">
                                    <p className="text-sm text-neutral-600">
                                        Subtotal: {DisplayPriceInAud(order.subtotal)}
                                    </p>
                                    <p className="text-lg font-bold">Grand Total: {DisplayPriceInAud(order.total)}</p>
                                    <p className="text-xs text-neutral-500">
                                        Payment: {order.paymentMethod} • Status: {order.paymentStatus}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )})}
            </div>
        </div>
    );
};

export default MyOrdersPage;