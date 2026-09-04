"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import toast from "react-hot-toast";
import CategoryModal from "./components/CategoryModal";

interface Category {
    id: string;
    title: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    products: Array<{ id: string }>;
}

const AdminCategoriesPage = () => {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await Axios({ ...SummeryApi.getAllCategories });
            if (response.data?.success) {
                setCategories(response.data?.data || []);
            } else {
                toast.error(response.data?.message || "Failed to fetch categories");
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this category?"))
            return;
        try {
            setDeleteLoading(id);
            const response = await Axios({
                ...SummeryApi.deleteCategory,
                data: { id },
            });
            if (response.data?.success) {
                toast.success("Category deleted successfully");
                setCategories((prev) => prev.filter((c) => c.id !== id));
            } else {
                toast.error(
                    response.data?.message || "Failed to delete category"
                );
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setDeleteLoading(null);
        }
    };

    const handleOpenModal = (category: Category | null = null) => {
        setEditingCategory(category);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
    };

    const handleCategorySaved = (category: Category, isNew: boolean) => {
        if (isNew) {
            setCategories((prev) => [category, ...prev]);
        } else {
            setCategories((prev) =>
                prev.map((c) => (c.id === category.id ? category : c))
            );
        }
        handleCloseModal();
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200 flex items-center gap-2"
                >
                    <span className="text-xl">+</span> Create New Category
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-600 text-sm font-medium">Total Categories</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{categories.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-600 text-sm font-medium">Active Categories</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{categories.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-gray-600 text-sm font-medium">
                        Total Products
                    </h3>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                        {categories.reduce((sum, c) => sum + (c.products?.length || 0), 0)}
                    </p>
                </div>
            </div>

            {/* Categories Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Slug
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Products Count
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No categories found. Create one to get started!
                                </td>
                            </tr>
                        ) : (
                            categories.map((category, index) => (
                                <tr key={category.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {category.title}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <code className="text-xs bg-gray-100 px-3 py-1 rounded text-gray-700">
                                            {category.slug}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                            {category.products?.length || 0} products
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(category.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenModal(category)}
                                                className="text-blue-600 hover:text-blue-900 font-semibold transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                disabled={deleteLoading === category.id}
                                                className={`font-semibold transition ${deleteLoading === category.id
                                                        ? "text-gray-400 cursor-not-allowed"
                                                        : "text-red-600 hover:text-red-900"
                                                    }`}
                                            >
                                                {deleteLoading === category.id ? "Deleting..." : "Delete"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Category Modal */}
            {showModal && (
                <CategoryModal
                    category={editingCategory}
                    onClose={handleCloseModal}
                    onSave={handleCategorySaved}
                />
            )}
        </div>
    );
};

export default AdminCategoriesPage;
