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

interface SubcategoryModalProps {
    subcategory: Subcategory | null;
    categories: Category[];
    defaultCategoryId: string;
    onClose: () => void;
    onSave: (subcategory: Subcategory, isNew: boolean) => void;
}

const SubcategoryModal: React.FC<SubcategoryModalProps> = ({
    subcategory,
    categories,
    defaultCategoryId,
    onClose,
    onSave,
}) => {
    const [formData, setFormData] = useState({ title: "", categoryId: "" });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (subcategory) {
            setFormData({ title: subcategory.title, categoryId: subcategory.categoryId });
        } else {
            setFormData({ title: "", categoryId: defaultCategoryId || categories[0]?.id || "" });
        }
        setErrors({});
    }, [subcategory, defaultCategoryId, categories]);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.title.trim()) {
            newErrors.title = "Subcategory name is required";
        } else if (formData.title.trim().length < 2) {
            newErrors.title = "Subcategory name must be at least 2 characters";
        } else if (formData.title.trim().length > 50) {
            newErrors.title = "Subcategory name must be less than 50 characters";
        }
        if (!subcategory && !formData.categoryId) {
            newErrors.categoryId = "Please select a category";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            setLoading(true);
            if (subcategory) {
                const response = await Axios({
                    ...SummeryApi.updateSubcategory,
                    data: { id: subcategory.id, title: formData.title },
                });
                if (response.data?.success) {
                    toast.success("Subcategory updated successfully!");
                    onSave({ ...subcategory, ...response.data?.data }, false);
                } else {
                    toast.error(response.data?.message || "Failed to update subcategory");
                }
            } else {
                const response = await Axios({
                    ...SummeryApi.createSubcategory,
                    data: { title: formData.title, categoryId: formData.categoryId },
                });
                if (response.data?.success) {
                    toast.success("Subcategory created successfully!");
                    onSave(response.data?.data, true);
                } else {
                    toast.error(response.data?.message || "Failed to create subcategory");
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
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">
                        {subcategory ? "Edit Subcategory" : "Create New Subcategory"}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                        <IoClose size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleChange}
                            disabled={loading || !!subcategory}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition disabled:bg-gray-50 disabled:cursor-not-allowed ${
                                errors.categoryId
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                            }`}
                        >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.title}</option>
                            ))}
                        </select>
                        {errors.categoryId && (
                            <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>
                        )}
                        {subcategory && (
                            <p className="text-gray-500 text-xs mt-1">
                                Category cannot be changed after creation.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subcategory Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter subcategory name"
                            maxLength={50}
                            disabled={loading}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                                errors.title
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                            }`}
                        />
                        {errors.title && (
                            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">{formData.title.length}/50</p>
                    </div>

                    {subcategory && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Slug <span className="text-gray-400">(Auto-generated)</span>
                            </label>
                            <input
                                type="text"
                                value={subcategory.slug}
                                readOnly
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                            />
                        </div>
                    )}

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
                                    {subcategory ? "Updating..." : "Creating..."}
                                </>
                            ) : (
                                <>{subcategory ? "Update Subcategory" : "Create Subcategory"}</>
                            )}
                        </button>
                    </div>
                </form>

                <div className="px-6 pb-6 bg-blue-50 rounded-b-lg">
                    <p className="text-xs text-blue-700">
                        {subcategory
                            ? "Update the subcategory name. The slug will be automatically regenerated."
                            : "Create a new subcategory under the selected category."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubcategoryModal;