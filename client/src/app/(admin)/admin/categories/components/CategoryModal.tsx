"use client";
import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import toast from "react-hot-toast";

interface Category {
    id: string;
    title: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    products: Array<{ id: string }>;
}

interface CategoryModalProps {
    category: Category | null;
    onClose: () => void;
    onSave: (category: Category, isNew: boolean) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
    category,
    onClose,
    onSave,
}) => {
    const [formData, setFormData] = useState({
        title: "",
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (category) {
            setFormData({
                title: category.title,
            });
        } else {
            setFormData({
                title: "",
            });
        }
        setErrors({});
    }, [category]);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.title.trim()) {
            newErrors.title = "Category name is required";
        }

        if (formData.title.trim().length < 2) {
            newErrors.title = "Category name must be at least 2 characters";
        }

        if (formData.title.trim().length > 50) {
            newErrors.title = "Category name must be less than 50 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            if (category) {
                // Update category
                const response = await Axios({
                    ...SummeryApi.updateCategory,
                    data: {
                        id: category.id,
                        title: formData.title,
                    },
                });

                if (response.data?.success) {
                    toast.success("Category updated successfully!");
                    onSave(response.data?.data, false);
                } else {
                    toast.error(response.data?.message || "Failed to update category");
                }
            } else {
                // Create new category
                const response = await Axios({
                    ...SummeryApi.createCategory,
                    data: {
                        title: formData.title,
                    },
                });

                if (response.data?.success) {
                    toast.success("Category created successfully!");
                    onSave(response.data?.data, true);
                } else {
                    toast.error(response.data?.message || "Failed to create category");
                }
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">
                        {category ? "Edit Category" : "Create New Category"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <IoClose size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter category name"
                            maxLength={50}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.title
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
                            disabled={loading}
                        />
                        {errors.title && (
                            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                            {formData.title.length}/50
                        </p>
                    </div>

                    {/* Slug Display (Read-only) */}
                    {category && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Slug <span className="text-gray-400">(Auto-generated)</span>
                            </label>
                            <input
                                type="text"
                                value={category.slug}
                                readOnly
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                            />
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {category ? "Updating..." : "Creating..."}
                                </>
                            ) : (
                                <>{category ? "Update Category" : "Create Category"}</>
                            )}
                        </button>
                    </div>
                </form>

                {/* Info Box */}
                <div className="px-6 pb-6 bg-blue-50 rounded-b-lg">
                    <p className="text-xs text-blue-700">
                        {category
                            ? "Update the category name. The slug will be automatically generated."
                            : "Create a new category to organize your products."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CategoryModal;
