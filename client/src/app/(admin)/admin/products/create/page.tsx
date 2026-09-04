"use client";
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch, RootState } from '@/redux/store';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import toast from 'react-hot-toast';
import { fetchCategories } from '@/redux/slices/categorySlice';
import ImageUploader from '../../components/ImageUploader';
import RolePricingFields from '../RolePricingFields';

interface MoreDetails {
    [key: string]: string;
}

interface Subcategory {
    id: string;
    title: string;
    slug: string;
}

const ProductCreatePage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { categories } = useSelector((state: RootState) => state.categorySlice);

    // Form state
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [colors, setColors] = useState<string[]>([]);
    const [colorInput, setColorInput] = useState('');
    const [sizes, setSizes] = useState<string[]>([]);
    const [sizeInput, setSizeInput] = useState('');
    const [discount, setDiscount] = useState('');
    const [priceByRole, setPriceByRole] = useState<Record<string, string>>({});
    const [moreDetails, setMoreDetails] = useState<MoreDetails>({});
    const [detailKey, setDetailKey] = useState('');
    const [detailValue, setDetailValue] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [subcategoryId, setSubcategoryId] = useState('');
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    const [stock, setStock] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);

    // Optional detail fields
    const [pack, setPack] = useState('');
    const [absorbency, setAbsorbency] = useState('');
    const [pricingNotes, setPricingNotes] = useState('');
    const [keyFeatures, setKeyFeatures] = useState<string[]>([]);
    const [featureInput, setFeatureInput] = useState('');

    // Fetch categories on mount
    useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    // Fetch subcategories when category changes
    useEffect(() => {
        if (categoryId) {
            const fetchSubcategories = async () => {
                try {
                    setLoadingSubcategories(true);
                    const response = await Axios({
                        ...SummeryApi.fetchSubcategoriesByCategory,
                        data: { categoryId },
                    });
                    if (response.data?.success) {
                        setSubcategories(response.data?.data);
                    } else {
                        setSubcategories([]);
                    }
                } catch (error) {
                    console.error('Failed to fetch subcategories', error);
                    setSubcategories([]);
                } finally {
                    setLoadingSubcategories(false);
                }
            };
            fetchSubcategories();
            // Reset subcategory selection when category changes
            setSubcategoryId('');
        } else {
            setSubcategories([]);
            setSubcategoryId('');
        }
    }, [categoryId]);

    // ---- Handlers for arrays ----
    const addColor = () => {
        if (colorInput.trim() && !colors.includes(colorInput.trim())) {
            setColors([...colors, colorInput.trim()]);
            setColorInput('');
        }
    };
    const removeColor = (color: string) => {
        setColors(colors.filter(c => c !== color));
    };

    const addSize = () => {
        if (sizeInput.trim() && !sizes.includes(sizeInput.trim())) {
            setSizes([...sizes, sizeInput.trim()]);
            setSizeInput('');
        }
    };
    const removeSize = (size: string) => {
        setSizes(sizes.filter(s => s !== size));
    };

    const addMoreDetail = () => {
        if (detailKey.trim() && detailValue.trim()) {
            setMoreDetails({ ...moreDetails, [detailKey.trim()]: detailValue.trim() });
            setDetailKey('');
            setDetailValue('');
        }
    };
    const removeMoreDetail = (key: string) => {
        const newDetails = { ...moreDetails };
        delete newDetails[key];
        setMoreDetails(newDetails);
    };

    const addFeature = () => {
        if (featureInput.trim() && !keyFeatures.includes(featureInput.trim())) {
            setKeyFeatures([...keyFeatures, featureInput.trim()]);
            setFeatureInput('');
        }
    };
    const removeFeature = (feature: string) => {
        setKeyFeatures(keyFeatures.filter(f => f !== feature));
    };

    const addImage = (url: string) => {
        if (!images.includes(url)) {
            setImages([...images, url]);
        }
    };
    const removeImage = (url: string) => {
        setImages(images.filter(img => img !== url));
    };

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !price || !categoryId) {
            toast.error('Title, price, and category are required');
            return;
        }

        const productData = {
            title,
            price: parseFloat(price),
            description: description || undefined,
            colors: colors.length ? colors : undefined,
            sizes: sizes.length ? sizes : undefined,
            discount: discount ? parseFloat(discount) : 0,
            more_details: Object.keys(moreDetails).length ? moreDetails : undefined,
            categoryId,
            subcategoryId: subcategoryId || undefined,   // <-- include subcategory if selected
            stock: stock ? parseInt(stock) : 0,
            images: images.length ? images : [],
            isActive,
            pack: pack || undefined,
            absorbency: absorbency || undefined,
            pricingNotes: pricingNotes || undefined,
            keyFeatures: keyFeatures.length ? keyFeatures : undefined,
            priceByRole,
        };

        try {
            setLoading(true);
            const response = await Axios({
                ...SummeryApi.createProduct,
                data: productData,
            });
            if (response.data?.success) {
                toast.success('Product created successfully!');
                router.push('/admin/products');
            } else {
                toast.error(response.data?.message || 'Failed to create product');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 py-12 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">Create New Product</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Price * (USD)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Discount (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Stock</label>
                        <input
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                </div>

                <RolePricingFields
                    values={priceByRole}
                    onChange={(role, value) => setPriceByRole((prev) => ({ ...prev, [role]: value }))}
                />

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        required
                    >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.title}</option>
                        ))}
                    </select>
                </div>

                {/* Subcategory (optional) */}
                {categoryId && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Subcategory (optional)</label>
                        {loadingSubcategories ? (
                            <p className="text-sm text-neutral-500">Loading subcategories...</p>
                        ) : subcategories.length > 0 ? (
                            <select
                                value={subcategoryId}
                                onChange={(e) => setSubcategoryId(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="">-- No subcategory (optional) --</option>
                                {subcategories.map((sub) => (
                                    <option key={sub.id} value={sub.id}>{sub.title}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-sm text-neutral-500">No subcategories available for this category.</p>
                        )}
                    </div>
                )}

                {/* Colors */}
                <div>
                    <label className="block text-sm font-medium mb-1">Colors</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={colorInput}
                            onChange={(e) => setColorInput(e.target.value)}
                            placeholder="e.g., Red"
                            className="flex-1 border rounded px-3 py-2"
                        />
                        <button type="button" onClick={addColor} className="bg-blue-600 text-white px-4 rounded">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {colors.map((color) => (
                            <span key={color} className="bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                {color}
                                <button type="button" onClick={() => removeColor(color)} className="text-red-500">✕</button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Sizes */}
                <div>
                    <label className="block text-sm font-medium mb-1">Sizes</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={sizeInput}
                            onChange={(e) => setSizeInput(e.target.value)}
                            placeholder="e.g., S, M, L, XL"
                            className="flex-1 border rounded px-3 py-2"
                        />
                        <button type="button" onClick={addSize} className="bg-blue-600 text-white px-4 rounded">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => (
                            <span key={size} className="bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                {size}
                                <button type="button" onClick={() => removeSize(size)} className="text-red-500">✕</button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Optional shop-page details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Pack (optional)</label>
                        <input
                            type="text"
                            value={pack}
                            onChange={(e) => setPack(e.target.value)}
                            placeholder="e.g., Pack of 20"
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Absorbency (optional)</label>
                        <input
                            type="text"
                            value={absorbency}
                            onChange={(e) => setAbsorbency(e.target.value)}
                            placeholder="e.g., Heavy · Overnight"
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Pricing notes (optional)</label>
                        <textarea
                            rows={2}
                            value={pricingNotes}
                            onChange={(e) => setPricingNotes(e.target.value)}
                            placeholder="e.g., Priced by size: S $34.90, M $37.90, L $40.90, XL $43.90"
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                </div>

                {/* Key features */}
                <div>
                    <label className="block text-sm font-medium mb-1">Key features (optional)</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={featureInput}
                            onChange={(e) => setFeatureInput(e.target.value)}
                            placeholder="e.g., Elastic leg cuffs for a firm seal"
                            className="flex-1 border rounded px-3 py-2"
                        />
                        <button type="button" onClick={addFeature} className="bg-blue-600 text-white px-4 rounded">Add</button>
                    </div>
                    <div className="space-y-1">
                        {keyFeatures.map((feature) => (
                            <div key={feature} className="bg-gray-50 p-2 rounded flex justify-between items-center">
                                <span>{feature}</span>
                                <button type="button" onClick={() => removeFeature(feature)} className="text-red-500">✕</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* More Details (key-value pairs) */}
                <div>
                    <label className="block text-sm font-medium mb-1">More Details (optional)</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            placeholder="Key (e.g., Material)"
                            value={detailKey}
                            onChange={(e) => setDetailKey(e.target.value)}
                            className="flex-1 border rounded px-3 py-2"
                        />
                        <input
                            type="text"
                            placeholder="Value (e.g., Cotton)"
                            value={detailValue}
                            onChange={(e) => setDetailValue(e.target.value)}
                            className="flex-1 border rounded px-3 py-2"
                        />
                        <button type="button" onClick={addMoreDetail} className="bg-blue-600 text-white px-4 rounded">Add</button>
                    </div>
                    <div className="space-y-1">
                        {Object.entries(moreDetails).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 p-2 rounded flex justify-between items-center">
                                <span><strong>{key}:</strong> {value}</span>
                                <button type="button" onClick={() => removeMoreDetail(key)} className="text-red-500">✕</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Images */}
                <div>
                    <label className="block text-sm font-medium mb-1">Images</label>
                    <div className="mb-2">
                        <ImageUploader onUploaded={addImage} label="Upload image" />
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                        {images.map((url, idx) => (
                            <div key={idx} className="relative group">
                                <img src={url} alt={`Preview ${idx}`} className="w-full h-20 object-cover rounded border" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(url)}
                                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                                >✕</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active status */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium">Product Active (visible in store)</label>
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Creating...' : 'Create Product'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductCreatePage;