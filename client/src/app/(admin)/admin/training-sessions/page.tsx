"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import { format } from 'date-fns';
import Loader from '@/app/(main)/components/UI/Loader';

interface TrainingSession {
    id: string;
    tag: string;
    title: string;
    audience: string;
    durationMin: number;
    sessionType: string;
    startsAt: string | null;
    capacity: number | null;
    isPublished: boolean;
    createdAt: string;
    _count: { registrations: number };
}

const AdminTrainingSessionsPage = () => {
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [publishLoading, setPublishLoading] = useState<string | null>(null);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await Axios({ ...SummeryApi.getAllTrainingSessionsAdmin });
            if (response.data?.success) {
                setSessions(response.data.data);
            } else {
                toast.error(response.data?.message || 'Failed to fetch training sessions');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this training session?')) return;
        try {
            setDeleteLoading(id);
            const response = await Axios({ ...SummeryApi.deleteTrainingSession, data: { id } });
            if (response.data?.success) {
                toast.success('Training session deleted');
                setSessions((prev) => prev.filter((s) => s.id !== id));
            } else {
                toast.error(response.data?.message || 'Delete failed');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setDeleteLoading(null);
        }
    };

    const togglePublish = async (session: TrainingSession) => {
        try {
            setPublishLoading(session.id);
            const response = await Axios({
                ...SummeryApi.updateTrainingSession,
                data: { id: session.id, isPublished: !session.isPublished },
            });
            if (response.data?.success) {
                toast.success(`Session ${!session.isPublished ? 'published' : 'unpublished'}`);
                setSessions((prev) =>
                    prev.map((s) => (s.id === session.id ? { ...s, isPublished: !s.isPublished } : s))
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
                <h1 className="text-2xl font-bold">Training Sessions</h1>
                <Link
                    href="/admin/training-sessions/create"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    + Create New Session
                </Link>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">When</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrations</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sessions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No training sessions yet.
                                </td>
                            </tr>
                        ) : (
                            sessions.map((session) => (
                                <tr key={session.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{session.title}</div>
                                        <div className="text-sm text-gray-500">{session.tag} · {session.audience}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{session.sessionType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {session.startsAt ? format(new Date(session.startsAt), 'MMM dd, yyyy HH:mm') : '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                        {session._count.registrations}
                                        {session.capacity != null ? ` / ${session.capacity}` : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => togglePublish(session)}
                                            disabled={publishLoading === session.id}
                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                session.isPublished
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                            }`}
                                        >
                                            {publishLoading === session.id ? '...' : session.isPublished ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/admin/training-sessions/edit/${session.id}`}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(session.id)}
                                                disabled={deleteLoading === session.id}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                            >
                                                {deleteLoading === session.id ? '...' : 'Delete'}
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

export default AdminTrainingSessionsPage;
