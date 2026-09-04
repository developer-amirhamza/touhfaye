"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import toast from "react-hot-toast";
import OrderDetailModal from "./components/OrderDetailModal";
import { FaEye, FaFilter, FaFileExcel, FaFilePdf } from "react-icons/fa";
import { format } from "date-fns";
import { baseUrl } from "@/app/common/SummeryApi";

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
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

type FilterType = "all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled";
type PaymentFilterType = "all" | "Pending" | "Completed" | "Failed" | "Cancelled";

const AdminOrdersPage = () => {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<FilterType>("all");
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilterType>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [exporting, setExporting] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await Axios({ ...SummeryApi.fetchAllOrdersByAdmin });
            if (response.data?.success) {
                setOrders(response.data?.data || []);
                setFilteredOrders(response.data?.data || []);
            } else {
                toast.error(response.data?.message || "Failed to fetch orders");
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = orders;

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((order) => order.orderStatus.toLowerCase() === statusFilter.toLowerCase());
        }

        // Payment filter
        if (paymentFilter !== "all") {
            filtered = filtered.filter((order) => order.paymentStatus === paymentFilter);
        }

        // Date range filter
        if (startDate) {
            const from = new Date(`${startDate}T00:00:00`);
            filtered = filtered.filter((order) => new Date(order.createdAt) >= from);
        }
        if (endDate) {
            const to = new Date(`${endDate}T23:59:59.999`);
            filtered = filtered.filter((order) => new Date(order.createdAt) <= to);
        }

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter((order) =>
                order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredOrders(filtered);
    }, [orders, statusFilter, paymentFilter, searchTerm, startDate, endDate]);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
    };

    const handleCloseModal = () => {
        setShowDetailModal(false);
        setSelectedOrder(null);
    };

    const handleOrderUpdated = (updatedOrder: Order) => {
        setOrders((prev) =>
            prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
        );
        setFilteredOrders((prev) =>
            prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
        );
        handleCloseModal();
    };

    // Rows for one order's line items — shared by both Excel exports.
    const orderRows = (order: Order) =>
        order.items.map((it) => ({
            "Order #": order.orderNumber,
            Date: format(new Date(order.createdAt), "dd MMM yyyy"),
            Customer: order.name,
            Email: order.email,
            Phone: order.phone,
            "Shipping Address": order.shippingAddress,
            Product: it.productName,
            Quantity: it.quantity,
            "Unit Price": +it.price.toFixed(2),
            "Line Total": +it.total.toFixed(2),
            Subtotal: +order.subtotal.toFixed(2),
            Delivery: +order.shippingCost.toFixed(2),
            Tax: +order.tax.toFixed(2),
            "Order Total": +order.total.toFixed(2),
            "Payment Method": order.paymentMethod,
            "Payment Status": order.paymentStatus,
            "Order Status": order.orderStatus,
        }));

    const ORDER_COLS = [
        { wch: 18 }, { wch: 13 }, { wch: 20 }, { wch: 26 }, { wch: 14 }, { wch: 34 },
        { wch: 34 }, { wch: 9 }, { wch: 11 }, { wch: 11 }, { wch: 10 }, { wch: 9 },
        { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 13 },
    ];

    // Export the currently filtered order list (one row per line item).
    const handleExportList = async () => {
        try {
            setExporting(true);
            const XLSX = await import("xlsx");
            const rows = filteredOrders.flatMap(orderRows);
            const ws = XLSX.utils.json_to_sheet(rows);
            ws["!cols"] = ORDER_COLS;
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Orders");
            XLSX.writeFile(wb, `orders-export-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
            toast.success(`Exported ${filteredOrders.length} orders`);
        } catch (e) {
            console.error(e);
            toast.error("Export failed");
        } finally {
            setExporting(false);
        }
    };

    // Export one order to its own workbook.
    const handleExportSingle = async (order: Order) => {
        try {
            const XLSX = await import("xlsx");
            const ws = XLSX.utils.json_to_sheet(orderRows(order));
            ws["!cols"] = ORDER_COLS;
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, order.orderNumber.slice(0, 31));
            XLSX.writeFile(wb, `order-${order.orderNumber}.xlsx`);
            toast.success(`Exported ${order.orderNumber}`);
        } catch (e) {
            console.error(e);
            toast.error("Export failed");
        }
    };

    // Download the server-generated PDF invoice for one order.
    const handleDownloadInvoice = async (order: Order) => {
        try {
            setDownloadingId(order.id);
            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${baseUrl}/api/orders/admin/invoice/${order.id}`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: "include",
            });
            if (!response.ok) throw new Error("Invoice download failed");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice-${order.orderNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success(`Invoice ${order.orderNumber} downloaded`);
        } catch (e) {
            console.error(e);
            toast.error("Invoice download failed");
        } finally {
            setDownloadingId(null);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "processing":
                return "bg-blue-100 text-blue-800";
            case "shipped":
                return "bg-indigo-100 text-indigo-800";
            case "delivered":
                return "bg-green-100 text-green-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getPaymentBadgeColor = (status: string) => {
        switch (status) {
            case "Pending":
                return "bg-yellow-100 text-yellow-800";
            case "Completed":
                return "bg-green-100 text-green-800";
            case "Failed":
                return "bg-red-100 text-red-800";
            case "Cancelled":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff8800]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container  mx-auto p-4">
            {/* Header */}
            <div className="mb-6 flex flex-wrap mt-3 items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Orders Management</h1>
                    <p className="text-gray-600">Manage and track all customer orders</p>
                </div>
                <button
                    onClick={handleExportList}
                    disabled={exporting || loading || filteredOrders.length === 0}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-50"
                >
                    <FaFileExcel />
                    {exporting ? "Exporting…" : "Export to Excel"}
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-600 text-sm font-medium">Total Orders</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{orders.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-600 text-sm font-medium">Pending Orders</h3>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                        {orders.filter((o) => o.orderStatus.toLowerCase() === "pending").length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-600 text-sm font-medium">Shipped Orders</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                        {orders.filter((o) => o.orderStatus.toLowerCase() === "shipped").length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-600 text-sm font-medium">Total Revenue</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        ${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <FaFilter className="text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Filters</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search
                        </label>
                        <input
                            type="text"
                            placeholder="Order #, Email, Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Order Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Order Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as FilterType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Payment Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Status
                        </label>
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilterType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Payments</option>
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Failed">Failed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Date range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            max={endDate || undefined}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            min={startDate || undefined}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setStatusFilter("all");
                                setPaymentFilter("all");
                                setSearchTerm("");
                                setStartDate("");
                                setEndDate("");
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                <div className="mt-3 text-sm text-gray-600">
                    Showing {filteredOrders.length} of {orders.length} orders
                </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Items
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payment Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                    <p className="text-lg">No orders found</p>
                                    <p className="text-sm">Try adjusting your filters</p>
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {order.orderNumber}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm">
                                            <p className="font-medium text-gray-900">{order.name}</p>
                                            <p className="text-gray-500 text-xs">{order.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-700">
                                            {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-semibold text-gray-900">
                                            ${order.total.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(order.orderStatus)}`}>
                                            {order.orderStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPaymentBadgeColor(order.paymentStatus)}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleViewDetails(order)}
                                                title="View details"
                                                className="text-blue-600 hover:text-blue-900 font-semibold transition flex items-center gap-1"
                                            >
                                                <FaEye size={14} />
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleExportSingle(order)}
                                                title="Export this order to Excel"
                                                className="text-green-600 hover:text-green-800 transition"
                                            >
                                                <FaFileExcel size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadInvoice(order)}
                                                disabled={downloadingId === order.id}
                                                title="Download PDF invoice"
                                                className="text-red-600 hover:text-red-800 transition disabled:opacity-50"
                                            >
                                                <FaFilePdf size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Order Detail Modal */}
            {showDetailModal && selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={handleCloseModal}
                    onUpdate={handleOrderUpdated}
                />
            )}
        </div>
    );
};

export default AdminOrdersPage;
