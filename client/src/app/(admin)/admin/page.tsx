"use client"
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { useRouter } from 'next/navigation'
import IsAdmin from '@/utils/IsAdmin'
import Axios from '@/utils/Axios'
import { SummeryApi } from '@/app/common/SummeryApi'
import AxiosToastError from '@/utils/AxiosToastError'
import { FaShoppingCart, FaBoxOpen, FaDollarSign, FaUsers, FaStar } from 'react-icons/fa'

interface DashboardStats {
    totalOrders: number
    totalProducts: number
    totalRevenue: number
    totalUsers: number
    totalReviews: number
    averageRating: number
}

interface RecentOrder {
    id: string
    orderNumber?: string
    totalAmount: number
    status: string
    createdAt: string
    user?: { name: string; email?: string }
}

const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string
    value: string | number
    icon: React.ElementType
    color: string
}) => (
    <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="text-white text-xl" />
        </div>
        <div>
            <h3 className="text-gray-500 text-sm font-medium">{label}</h3>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        </div>
    </div>
)

const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-purple-100 text-purple-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
}

const AdminDashboard = () => {
    const { user } = useSelector((state: RootState) => state.userSlice)
    const router = useRouter()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user && !IsAdmin(user.role)) {
            router.push("/")
        }
    }, [user, router])

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true)
                const [ordersRes, productsRes, usersRes, reviewsRes] = await Promise.allSettled([
                    Axios({ ...SummeryApi.fetchAllOrdersByAdmin }),
                    Axios({ ...SummeryApi.fetchProducts }),
                    Axios({ ...SummeryApi.getAllUser }),
                    Axios({ ...SummeryApi.getAllReviews }),
                ])

                let totalOrders = 0
                let totalRevenue = 0
                let recent: RecentOrder[] = []

                if (ordersRes.status === "fulfilled" && ordersRes.value.data?.success) {
                    const orders: RecentOrder[] = ordersRes.value.data?.data?.orders || ordersRes.value.data?.data || []
                    totalOrders = orders.length
                    totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
                    recent = [...orders].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8)
                }

                const totalProducts =
                    productsRes.status === "fulfilled" && productsRes.value.data?.success
                        ? (productsRes.value.data?.data?.products || productsRes.value.data?.data || []).length
                        : 0

                const totalUsers =
                    usersRes.status === "fulfilled" && usersRes.value.data?.success
                        ? (usersRes.value.data?.data?.users || usersRes.value.data?.data || []).length
                        : 0

                let totalReviews = 0
                let averageRating = 0
                if (reviewsRes.status === "fulfilled" && reviewsRes.value.data?.success) {
                    totalReviews = reviewsRes.value.data?.data?.totalReviews || 0
                    averageRating = reviewsRes.value.data?.data?.averageRating || 0
                }

                setStats({ totalOrders, totalProducts, totalRevenue, totalUsers, totalReviews, averageRating })
                setRecentOrders(recent)
            } catch (error) {
                AxiosToastError(error)
            } finally {
                setLoading(false)
            }
        }

        if (user && IsAdmin(user.role)) {
            fetchDashboardData()
        }
    }, [user])

    if (loading) {
        return (
            <div className="w-full h-full p-6 bg-slate-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        )
    }

    return (
        <div className="w-full h-full p-6 bg-slate-100">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">
                    Welcome, {user?.name}
                </h1>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                    <StatCard label="Total Orders" value={stats?.totalOrders ?? 0} icon={FaShoppingCart} color="bg-blue-500" />
                    <StatCard label="Total Products" value={stats?.totalProducts ?? 0} icon={FaBoxOpen} color="bg-green-500" />
                    <StatCard
                        label="Total Revenue"
                        value={`$${(stats?.totalRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        icon={FaDollarSign}
                        color="bg-yellow-500"
                    />
                    <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={FaUsers} color="bg-purple-500" />
                    <StatCard
                        label={`Reviews (${(stats?.averageRating ?? 0).toFixed(1)}★)`}
                        value={stats?.totalReviews ?? 0}
                        icon={FaStar}
                        color="bg-amber-500"
                    />
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
                        <button
                            onClick={() => router.push("/admin/orders")}
                            className="text-sm text-blue-600 hover:underline font-medium"
                        >
                            View all
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        {recentOrders.length === 0 ? (
                            <p className="text-gray-500 p-6">No orders yet.</p>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentOrders.map((order, i) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-800">
                                                {order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                <p className="font-medium">{order.user?.name || "—"}</p>
                                                {order.user?.email && (
                                                    <p className="text-xs text-gray-400">{order.user.email}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                                                ${order.totalAmount?.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor[order.status] || "bg-gray-100 text-gray-600"}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard