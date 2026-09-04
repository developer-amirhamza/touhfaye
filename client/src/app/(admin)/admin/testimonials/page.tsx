"use client";
import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import toast from "react-hot-toast";
import { FaStar, FaRegStar, FaTrash, FaEdit, FaPlus, FaTimes } from "react-icons/fa";

interface Testimonial {
    id: string;
    name: string;
    role?: string;
    location?: string;
    quote: string;
    rating: number;
    isActive: boolean;
    createdAt: string;
}

const emptyForm = { name: "", role: "", location: "", quote: "", rating: 5 };

const RatingStars = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((i) =>
            rating >= i ? <FaStar key={i} /> : <FaRegStar key={i} />
        )}
    </div>
);

const RatingPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => onChange(i)}>
                {value >= i
                    ? <FaStar className="text-amber-400 text-xl" />
                    : <FaRegStar className="text-gray-300 text-xl" />}
            </button>
        ))}
    </div>
);

const AdminTestimonialsPage = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Testimonial | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const res = await Axios({ ...SummeryApi.getAllTestimonials });
            if (res.data?.success) setTestimonials(res.data.data || []);
        } catch (err) {
            AxiosToastError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTestimonials(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (t: Testimonial) => {
        setEditing(t);
        setForm({ name: t.name, role: t.role || "", location: t.location || "", quote: t.quote, rating: t.rating });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditing(null); setForm(emptyForm); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.quote.trim()) {
            toast.error("Name and quote are required");
            return;
        }
        try {
            setSaving(true);
            const payload = { ...form, role: form.role || undefined, location: form.location || undefined };
            let res;
            if (editing) {
                res = await Axios({ ...SummeryApi.updateTestimonial, data: { id: editing.id, ...payload } });
            } else {
                res = await Axios({ ...SummeryApi.createTestimonial, data: payload });
            }
            if (res.data?.success) {
                toast.success(editing ? "Testimonial updated" : "Testimonial created");
                closeModal();
                fetchTestimonials();
            } else {
                toast.error(res.data?.message || "Failed to save testimonial");
            }
        } catch (err) {
            AxiosToastError(err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (t: Testimonial) => {
        try {
            const res = await Axios({ ...SummeryApi.updateTestimonial, data: { id: t.id, isActive: !t.isActive } });
            if (res.data?.success) {
                toast.success(t.isActive ? "Testimonial hidden" : "Testimonial shown");
                setTestimonials((prev) => prev.map((x) => x.id === t.id ? { ...x, isActive: !x.isActive } : x));
            }
        } catch (err) {
            AxiosToastError(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this testimonial?")) return;
        try {
            setDeleteLoading(id);
            const res = await Axios({ ...SummeryApi.deleteTestimonial, data: { id } });
            if (res.data?.success) {
                toast.success("Deleted");
                setTestimonials((prev) => prev.filter((t) => t.id !== id));
            }
        } catch (err) {
            AxiosToastError(err);
        } finally {
            setDeleteLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Testimonials</h1>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition"
                >
                    <FaPlus className="text-sm" /> Add Testimonial
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-500 text-sm">Total</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{testimonials.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-500 text-sm">Active</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{testimonials.filter((t) => t.isActive).length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-500 text-sm">Avg Rating</p>
                    <p className="text-3xl font-bold text-amber-500 mt-1">
                        {testimonials.length > 0
                            ? (testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length).toFixed(1)
                            : "—"}
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {testimonials.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No testimonials yet. Add your first one!
                                </td>
                            </tr>
                        ) : (
                            testimonials.map((t, i) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                                        {(t.role || t.location) && (
                                            <p className="text-xs text-gray-400">{[t.role, t.location].filter(Boolean).join(", ")}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <p className="text-sm text-gray-700 line-clamp-2">&ldquo;{t.quote}&rdquo;</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <RatingStars rating={t.rating} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleActive(t)}
                                            className={`px-2 py-1 rounded-full text-xs font-semibold transition ${t.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                                        >
                                            {t.isActive ? "Active" : "Hidden"}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEdit(t)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                            >
                                                <FaEdit className="text-xs" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                disabled={deleteLoading === t.id}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${deleteLoading === t.id ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                                            >
                                                <FaTrash className="text-xs" />
                                                {deleteLoading === t.id ? "..." : "Delete"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editing ? "Edit Testimonial" : "Add Testimonial"}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Sarah M."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <input
                                        type="text"
                                        value={form.role}
                                        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Family carer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Brisbane"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quote *</label>
                                <textarea
                                    value={form.quote}
                                    onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="What did they say?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                <RatingPicker value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-60"
                                >
                                    {saving ? "Saving..." : editing ? "Save Changes" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTestimonialsPage;