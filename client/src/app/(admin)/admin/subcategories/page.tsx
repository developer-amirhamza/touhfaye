"use client";
import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import toast from "react-hot-toast";
import SubcategoryModal from "../components/SubcategoryModal";

interface Category {
    id: string;
    title: string;
    slug: string;
}

interface Subcategory {
    id: string;
    title: string;
    slug: string;
    categoryId: string;
    createdAt: string;
    updatedAt: string;
    products?: Array<{ id: string }>;
}

const AdminSubcategoriesPage = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await Axios({ ...SummeryApi.getAllCategories });
            if (response.data?.success) {
                const cats: Category[] = response.data?.data || [];
                setCategories(cats);
                if (cats.length > 0) {
                    setSelectedCategoryId(cats[0].id);
                }
            } else {
                toast.error(response.data?.message || "Failed to fetch categories");
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const fetchSubcategories = async (categoryId: string) => {
        if (!categoryId) return;
        try {
            setLoadingSubcategories(true);
            const response = await Axios({
                ...SummeryApi.fetchSubcategoriesByCategory,
                data: { categoryId },
            });
            if (response.data?.success) {
                setSubcategories(response.data?.data || []);
            } else {
                toast.error(response.data?.message || "Failed to fetch subcategories");
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoadingSubcategories(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategoryId) {
            fetchSubcategories(selectedCategoryId);
        } else {
            setSubcategories([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategoryId]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this subcategory?")) return;
        try {
            setDeleteLoading(id);
            const response = await Axios({
                ...SummeryApi.deleteSubcategory,
                data: { id },
            });
            if (response.data?.success) {
                toast.success("Subcategory deleted successfully");
                setSubcategories((prev) => prev.filter((s) => s.id !== id));
            } else {
                toast.error(response.data?.message || "Failed to delete subcategory");
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setDeleteLoading(null);
        }
    };

    const handleOpenModal = (subcategory: Subcategory | null = null) => {
        setEditingSubcategory(subcategory);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSubcategory(null);
    };

    const handleSubcategorySaved = (subcategory: Subcategory, isNew: boolean) => {
        if (isNew) {
            if (subcategory.categoryId === selectedCategoryId) {
                setSubcategories((prev) => [subcategory, ...prev]);
            }
        } else {
            setSubcategories((prev) =>
                prev.map((s) => (s.id === subcategory.id ? subcategory : s))
            );
        }
        handleCloseModal();
    };

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

    if (loadingCategories) {
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
                <h1 className="text-3xl font-bold text-gray-800">Subcategories</h1>
                <button
                    onClick={() => handleOpenModal()}
                    disabled={categories.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="text-xl">+</span> Create New Subcategory
                </button>
            </div>

            {categories.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    No categories found. Create a category first before adding subcategories.
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">
                            Filter by Category:
                        </label>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full sm:w-64"
                        >
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-gray-600 text-sm font-medium">Selected Category</h3>
                            <p className="text-2xl font-bold text-gray-800 mt-2">
                                {selectedCategory?.title || "—"}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-gray-600 text-sm font-medium">Total Subcategories</h3>
                            <p className="text-3xl font-bold text-blue-600 mt-2">
                                {subcategories.length}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-gray-600 text-sm font-medium">Total Products</h3>
                            <p className="text-3xl font-bold text-purple-600 mt-2">
                                {subcategories.reduce((sum, s) => sum + (s.products?.length || 0), 0)}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products Count</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loadingSubcategories ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : subcategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                            No subcategories found for this category. Create one to get started!
                                        </td>
                                    </tr>
                                ) : (
                                    subcategories.map((subcategory, index) => (
                                        <tr key={subcategory.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{index + 1}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-gray-900">{subcategory.title}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <code className="text-xs bg-gray-100 px-3 py-1 rounded text-gray-700">{subcategory.slug}</code>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                    {subcategory.products?.length || 0} products
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {subcategory.createdAt
                                                    ? new Date(subcategory.createdAt).toLocaleDateString()
                                                    : "—"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(subcategory)}
                                                        className="text-blue-600 hover:text-blue-900 font-semibold transition"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(subcategory.id)}
                                                        disabled={deleteLoading === subcategory.id}
                                                        className={`font-semibold transition ${
                                                            deleteLoading === subcategory.id
                                                                ? "text-gray-400 cursor-not-allowed"
                                                                : "text-red-600 hover:text-red-900"
                                                        }`}
                                                    >
                                                        {deleteLoading === subcategory.id ? "Deleting..." : "Delete"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {showModal && (
                <SubcategoryModal
                    subcategory={editingSubcategory}
                    categories={categories}
                    defaultCategoryId={selectedCategoryId}
                    onClose={handleCloseModal}
                    onSave={handleSubcategorySaved}
                />
            )}
        </div>
    );
};

export default AdminSubcategoriesPage;