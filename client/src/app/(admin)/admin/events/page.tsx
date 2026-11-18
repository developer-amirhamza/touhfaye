"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';

import { format } from 'date-fns';
import Loader from '@/app/(main)/components/UI/Loader';

interface EventRow {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    location: string;
    coverImage: string;
    isPublished: boolean;
    publishedAt: string;
    createdAt: string;
    views: number;
}

const AdminEventsPage = () => {
    const [events, setEvents] = useState<EventRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [publishLoading, setPublishLoading] = useState<string | null>(null);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummeryApi.getAdminAllEvents,
                params: { limit: 100 },
            });
            if (response.data?.success) {
                setEvents(response.data.data);
            } else {
                toast.error(response.data?.message || 'Failed to fetch events');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            setDeleteLoading(id);
            const response = await Axios({
                ...SummeryApi.deleteEvent,
                data: { id },
            });
            if (response.data?.success) {
                toast.success('Event deleted');
                setEvents(prev => prev.filter(e => e.id !== id));
            } else {
                toast.error(response.data?.message || 'Delete failed');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setDeleteLoading(null);
        }
    };

    const togglePublish = async (event: EventRow) => {
        try {
            setPublishLoading(event.id);
            const response = await Axios({
                ...SummeryApi.updateEvent,
                data: {
                    id: event.id,
                    isPublished: !event.isPublished,
                },
            });
            if (response.data?.success) {
                toast.success(`Event ${!event.isPublished ? 'published' : 'unpublished'}`);
                setEvents(prev =>
                    prev.map(e =>
                        e.id === event.id
                            ? { ...e, isPublished: !e.isPublished, publishedAt: !e.isPublished ? new Date().toISOString() : e.publishedAt }
                            : e
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
                <h1 className="font-secondary text-2xl text-title">Events</h1>
                <Link
                    href="/admin/events/create"
                    className="bg-secondary text-secondary-light px-4 py-2 rounded-lg font-medium hover:bg-secondary-hover transition-colors"
                >
                    + New event
                </Link>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg border border-primary-hover">
                <table className="min-w-full divide-y divide-primary-hover">
                    <thead className="bg-primary">
                        <tr>
                            <th className="px-6 py-3 text-left text-[11px] font-medium text-accent tracking-wider uppercase">Event</th>
                            <th className="px-6 py-3 text-left text-[11px] font-medium text-accent tracking-wider uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-[11px] font-medium text-accent tracking-wider uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-[11px] font-medium text-accent tracking-wider uppercase">Views</th>
                            <th className="px-6 py-3 text-left text-[11px] font-medium text-accent tracking-wider uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-[11px] font-medium text-accent tracking-wider uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-primary-hover">
                        {events.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-foreground">
                                    No events found.
                                </td>
                            </tr>
                        ) : (
                            events.map((event) => (
                                <tr key={event.id} className="hover:bg-primary/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary shrink-0">
                                                {event.coverImage && (
                                                    <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-secondary text-title">{event.title}</div>
                                                <div className="text-sm text-foreground line-clamp-1">{event.location || 'No location'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-foreground">{event.category || '—'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => togglePublish(event)}
                                            disabled={publishLoading === event.id}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${event.isPublished
                                                    ? 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                                                    : 'bg-accent-light/30 text-accent hover:bg-accent-light/50'
                                                }`}
                                        >
                                            {publishLoading === event.id ? '...' : event.isPublished ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-foreground">{event.views}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-foreground">
                                        {format(new Date(event.publishedAt || event.createdAt), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-3">
                                            <Link
                                                href={`/admin/events/edit/${event.id}`}
                                                className="text-secondary hover:text-secondary-hover"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                disabled={deleteLoading === event.id}
                                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                            >
                                                {deleteLoading === event.id ? '...' : 'Delete'}
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

export default AdminEventsPage;
