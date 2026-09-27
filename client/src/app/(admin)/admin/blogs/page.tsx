"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';

import { format } from 'date-fns';
import Loader from '@/app/(main)/components/UI/Loader';

interface Blog {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    isPublished: boolean;
    publishedAt: string;
    createdAt: string;
    author: { name: string };
    views: number;
}

const AdminBlogsPage = () => {
    const router = useRouter();
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [publishLoading, setPublishLoading] = useState<string | null>(null);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            // Admin can fetch all blogs (including drafts)
            const response = await Axios({
                ...SummeryApi.getAllBlogs,
                params: { all: true, limit: 100 }, // add a flag to fetch all for admin
            });
            if (response.data?.success) {
                setBlogs(response.data.data);
            } else {
                toast.error(response.data?.message || 'Failed to fetch blogs');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this blog?')) return;
        try {
            setDeleteLoading(id);
            const response = await Axios({
                ...SummeryApi.deleteBlog,
                data: { id },
            });
            if (response.data?.success) {
                toast.success('Blog deleted');
                setBlogs(prev => prev.filter(b => b.id !== id));
            } else {
                toast.error(response.data?.message || 'Delete failed');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setDeleteLoading(null);
        }
    };

    const togglePublish = async (blog: Blog) => {
        try {
            setPublishLoading(blog.id);
            const response = await Axios({
                ...SummeryApi.updateBlog,
                data: {
                    id: blog.id,
                    isPublished: !blog.isPublished,
                },
            });
            if (response.data?.success) {
                toast.success(`Blog ${!blog.isPublished ? 'published' : 'unpublished'}`);
                setBlogs(prev =>
                    prev.map(b =>
                        b.id === blog.id
                            ? { ...b, isPublished: !b.isPublished, publishedAt: !b.isPublished ? new Date().toISOString() : b.publishedAt }
                            : b
                    )
                );
            } else {
                toast.error(response.data?.message || 'Update failed');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setPublishLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center my-5 mb-6">
                <h1 className="font-secondary text-2xl text-title">Stories</h1>
                <Link
                    href="/admin/blogs/create"
                    className="bg-secondary text-secondary-light px-4 py-2 rounded-lg font-medium hover:bg-secondary-hover transition-colors"
                >
                    + New story
                </Link>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg border border-primary-hover">
                <table className="min-w-full divide-y divide-primary-hover">
                    <thead className="bg-primary">
                        <tr>
                            <th className="px-6 py-3 text-left text-[11px] font-medium text-accent tracking-wider uppercase">Title</th>
                            <th className="px-6 py-3 text-left text-[11px] font-medium text-accent tracking-wider uppercase">Author</th>
                            <th className="px-6 py-3 text-left text-[11px] font-medium text-accent tracking-wider uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-[11px] font-medium text-accent tracking-wider uppercase">Views</th>
                            <th className="px-6 py-3 text-left text-[11px] font-medium text-accent tracking-wider uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-[11px] font-medium text-accent tracking-wider uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-primary-hover">
                        {blogs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-foreground">
                                    No stories found.
                                </td>
                            </tr>
                        ) : (
                            blogs.map((blog) => (
                                <tr key={blog.id} className="hover:bg-primary/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-secondary text-title">{blog.title}</div>
                                        <div className="text-sm text-foreground line-clamp-1">{blog.excerpt || 'No excerpt'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-foreground">{blog.author?.name || 'Unknown'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => togglePublish(blog)}
                                            disabled={publishLoading === blog.id}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${blog.isPublished
                                                    ? 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                                                    : 'bg-accent-light/30 text-accent hover:bg-accent-light/50'
                                                }`}
                                        >
                                            {publishLoading === blog.id ? '...' : blog.isPublished ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-foreground">{blog.views}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-foreground">
                                        {format(new Date(blog.publishedAt || blog.createdAt), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-3">
                                            <Link
                                                href={`/admin/blogs/edit/${blog.id}`}
                                                className="text-secondary hover:text-secondary-hover"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(blog.id)}
                                                disabled={deleteLoading === blog.id}
                                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                            >
                                                {deleteLoading === blog.id ? '...' : 'Delete'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminBlogsPage;