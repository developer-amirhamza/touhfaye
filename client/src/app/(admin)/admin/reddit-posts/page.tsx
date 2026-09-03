"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import { format } from 'date-fns';
import Loader from '@/app/(main)/components/UI/Loader';

interface RedditPost {
    id: string;
    subreddit: string;
    title: string;
    author: string;
    flair: string;
    upvotes: number;
    comments: number;
    url: string;
    postedAt: string;
    isPublished: boolean;
}

const AdminRedditPostsPage = () => {
    const [posts, setPosts] = useState<RedditPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [publishLoading, setPublishLoading] = useState<string | null>(null);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await Axios({ ...SummeryApi.getAllRedditPostsAdmin });
            if (response.data?.success) {
                setPosts(response.data.data);
            } else {
                toast.error(response.data?.message || 'Failed to fetch reddit posts');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            setDeleteLoading(id);
            const response = await Axios({ ...SummeryApi.deleteRedditPost, data: { id } });
            if (response.data?.success) {
                toast.success('Post deleted');
                setPosts((prev) => prev.filter((p) => p.id !== id));
            } else {
                toast.error(response.data?.message || 'Delete failed');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setDeleteLoading(null);
        }
    };

    const togglePublish = async (post: RedditPost) => {
        try {
            setPublishLoading(post.id);
            const response = await Axios({
                ...SummeryApi.updateRedditPost,
                data: { id: post.id, isPublished: !post.isPublished },
            });
            if (response.data?.success) {
                toast.success(`Post ${!post.isPublished ? 'published' : 'unpublished'}`);
                setPosts((prev) =>
                    prev.map((p) => (p.id === post.id ? { ...p, isPublished: !p.isPublished } : p))
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
                <h1 className="text-2xl font-bold">Reddit Community Feed</h1>
                <Link
                    href="/admin/reddit-posts/create"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    + Create New Post
                </Link>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Post</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subreddit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posted</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votes / Comments</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {posts.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No reddit posts yet.
                                </td>
                            </tr>
                        ) : (
                            posts.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <a href={post.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:underline">
                                            {post.title}
                                        </a>
                                        <div className="text-sm text-gray-500">{post.author} · {post.flair}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{post.subreddit}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {format(new Date(post.postedAt), 'MMM dd, yyyy HH:mm')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {post.upvotes} / {post.comments}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => togglePublish(post)}
                                            disabled={publishLoading === post.id}
                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                post.isPublished
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                            }`}
                                        >
                                            {publishLoading === post.id ? '...' : post.isPublished ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/admin/reddit-posts/edit/${post.id}`}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                disabled={deleteLoading === post.id}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                            >
                                                {deleteLoading === post.id ? '...' : 'Delete'}
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

export default AdminRedditPostsPage;
