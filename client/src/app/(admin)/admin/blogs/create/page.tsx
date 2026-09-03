"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import toast from 'react-hot-toast';
import ImageUploader from '../../components/ImageUploader';

const RichTextEditor = dynamic(() => import('@/app/(main)/components/UI/RichTextEditor'), { ssr: false });

const CreateBlogPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        excerpt: '',
        content: '',
        featuredImage: '',
        category: '',
        tags: '',
        isPublished: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.content) {
            toast.error('Title and content are required');
            return;
        }
        const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
        try {
            setLoading(true);
            const response = await Axios({
                ...SummeryApi.createBlog,
                data: {
                    title: form.title,
                    excerpt: form.excerpt,
                    content: form.content,
                    featuredImage: form.featuredImage || undefined,
                    category: form.category || undefined,
                    tags: tagsArray,
                    isPublished: form.isPublished,
                },
            });
            if (response.data?.success) {
                toast.success('Blog created successfully');
                router.push('/admin/blogs');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto  p-4 max-w-4xl">
            <h1 className="text-2xl font-bold my-6">Create New Blog</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-medium mb-1">Title *</label>
                    <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">Excerpt (short description)</label>
                    <textarea
                        name="excerpt"
                        rows={2}
                        value={form.excerpt}
                        onChange={handleChange}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">Content *</label>
                    <RichTextEditor value={form.content} onChange={(html) => setForm(prev => ({ ...prev, content: html }))} />
                </div>
                <div>
                    <label className="block font-medium mb-1">Featured Image</label>
                    <div className="flex items-center gap-3">
                        {form.featuredImage && (
                            <img src={form.featuredImage} alt="Featured" className="w-20 h-20 object-cover rounded border" />
                        )}
                        <ImageUploader
                            onUploaded={(url) => setForm(prev => ({ ...prev, featuredImage: url }))}
                            label={form.featuredImage ? 'Replace image' : 'Upload image'}
                        />
                        {form.featuredImage && (
                            <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, featuredImage: '' }))}
                                className="text-red-500 text-sm"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium mb-1">Category</label>
                        <input
                            type="text"
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            placeholder="e.g., Health, Wellness"
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Tags (comma separated)</label>
                        <input
                            type="text"
                            name="tags"
                            value={form.tags}
                            onChange={handleChange}
                            placeholder="product, review, guide"
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="isPublished"
                        id="isPublished"
                        checked={form.isPublished}
                        onChange={handleChange}
                    />
                    <label htmlFor="isPublished">Publish immediately</label>
                </div>
                <div className="flex mb-12 gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Creating...' : 'Create Blog'}
                    </button>
                    <button type="button" onClick={() => router.back()} className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateBlogPage;