"use client";
import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaBox } from "react-icons/fa";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import toast from "react-hot-toast";
import { MdNoteAlt } from "react-icons/md";

interface OrderItem {
    id: string;
    productName: string;
    productImage?: string;
    price: number;
    quantity: number;
    total: number;
}

interface Order {
    id: string;
    orderNumber: string;
    name: string;
    email: string;
    phone: string;
    shippingAddress: string;
    subtotal: number;
    shippingCost: number;
    tax: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    orderNote?: string;
    adminNote?: string;
    fundingDetails?: any;
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

interface OrderDetailModalProps {
    order: Order;
    onClose: () => void;
    onUpdate: (order: Order) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
    order,
    onClose,
    onUpdate,
}) => {
    const [orderStatus, setOrderStatus] = useState(order.orderStatus);
    const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
    const [adminNote, setAdminNote] = useState(order.adminNote);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const handleUpdate = async () => {
        if (orderStatus === order.orderStatus && paymentStatus === order.paymentStatus && adminNote === order.adminNote) {
            toast.error("No changes to update");
            return;
        }

        try {
            setLoading(true);
            const response = await Axios({
                ...SummeryApi.updateOrderByAdmin,
                params: { orderId: order.id },
                data: {
                    orderStatus,
                    paymentStatus,
                    adminNote
                },
            });

            if (response.data?.success) {
                toast.success("Order updated successfully!");
                onUpdate(response.data?.data);
            } else {
                toast.error(response.data?.message || "Failed to update order");
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-110  min-w-full p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mt-30 ">
                {/* Header */}
                <div className="flex justify-between w-full items-center p-6 border-b  border-gray-200 bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
                        <p className="text-gray-600 text-sm">{order.orderNumber}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <IoClose size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Order Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer Information */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                        <span className="text-secondary font-semibold">👤</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 uppercase">Name</p>
                                        <p className="text-sm font-medium text-gray-900">{order.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <FaEnvelope className="w-4 h-4 text-secondary mt-1 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 uppercase">Email</p>
                                        <p className="text-sm font-medium text-gray-900">{order.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <FaPhone className="w-4 h-4 text-secondary mt-1 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 uppercase">Phone</p>
                                        <p className="text-sm font-medium text-gray-900">{order.phone}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <FaMapMarkerAlt className="w-4 h-4 text-secondary mt-1 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 uppercase">Shipping Address</p>
                                        <p className="text-sm font-medium text-gray-900">{order.shippingAddress}</p>
                                    </div>
                                </div>
                            </div>
                        </div>



                        {order?.adminNote &&
                        <div className="border border-gray-200 rounded-lg px-4 py-2">
                            <div className="flex items-start gap-3">
                                <MdNoteAlt className="w-4 h-4 text-secondary mt-1 shrink-0"/>
                                <h3 className="text-lg font-semibold text-gray-500 ">Admin Note</h3>
                            </div>
                             <p className="text-sm font-medium text-text">{order?.adminNote}</p>
                        </div> }

                        {order?.orderNote &&
                        <div className="border border-gray-200 rounded-lg px-4 py-2">
                            <div className="flex items-start gap-3">
                                <MdNoteAlt className="w-4 h-4 text-secondary mt-1 shrink-0"/>
                                <h3 className="text-lg font-semibold text-gray-500 ">Customer Note</h3>
                            </div>
                            <p className="text-sm font-medium text-text ">{order?.orderNote}</p>
                        </div>}

                        {/* Order Items */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FaBox className="text-secondary" />
                                Order Items ({order.items?.length || 0})
                            </h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {order.items?.map((item, index) => (
                                    <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                                        {item.productImage && (
                                            <img
                                                src={item.productImage}
                                                alt={item.productName}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{item.productName}</p>
                                            <p className="text-sm text-gray-600">
                                                ${item.price.toFixed(2)} × {item.quantity} = ${item.total.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Status & Summary */}
                    <div className="space-y-6">
                        {/* Price Summary */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>
                            <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium text-gray-900">${order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Shipping:</span>
                                    <span className="font-medium text-gray-900">${order.shippingCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tax:</span>
                                    <span className="font-medium text-gray-900">${order.tax.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-900">Total:</span>
                                <span className="font-bold text-lg text-green-600">${order.total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Order Status */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Order</h3>

                            {/* Order Status Select */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Order Status
                                </label>
                                <select
                                    value={orderStatus}
                                    onChange={(e) => setOrderStatus(e.target.value)}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Payment Status Select */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Status
                                </label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Failed">Failed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Admin Note about the order */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Admin Note
                                </label>
                                <textarea name="adminNote" id="adminNote"
                                 value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    disabled={loading}
                                    placeholder="Write a note"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
                                />
                            </div>

                            {/* Order Details */}
                            <div className="space-y-2 text-xs mb-4 pb-4 border-b border-gray-200">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Method:</span>
                                    <span className="font-medium text-gray-900">{order.paymentMethod}</span>
                                </div>
                                {order.fundingDetails && (order.paymentMethod === "NDIS" || order.paymentMethod === "HCP") && (
                                    <div className="mt-2 rounded-md border border-purple-200 bg-purple-50 p-2 space-y-1">
                                        <p className="font-semibold text-purple-800">
                                            {order.paymentMethod === "NDIS" ? "NDIS funding details" : "Home Care Package details"}
                                        </p>
                                        {Object.entries(order.fundingDetails).map(([k, v]) => (
                                            <div key={k} className="flex justify-between gap-3">
                                                <span className="text-gray-600 capitalize">{k.replace(/([A-Z])/g, " $1")}:</span>
                                                <span className="font-medium text-gray-900 text-right break-all">
                                                    {typeof v === "boolean" ? (v ? "Approved ✓" : "Not approved") : String(v)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Created:</span>
                                    <span className="font-medium text-gray-900">
                                        {new Date(order.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Edit/Save Buttons */}
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                >
                                    Edit Status
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setOrderStatus(order.orderStatus);
                                            setPaymentStatus(order.paymentStatus);
                                            setIsEditing(false);
                                        }}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Updating...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;
