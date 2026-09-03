"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";

// B2B "book a meeting, we'll call you" request. No calendar/video
// integration — a preferred time is a hint, not a confirmed slot; the team
// calls to confirm. Mirrors the TrainingSessionsSection register-modal
// pattern (same z-index scale, same success-state treatment).
export default function BookMeetingModal({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        preferredAt: "",
        message: "",
    });
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState<string | null>(null);

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.firstName.trim() || !form.lastName.trim()) return toast.error("Please enter your first name and surname");
        if (!form.email.trim()) return toast.error("Please enter your email address");
        if (!form.phone.trim()) return toast.error("Please enter a phone number so we can call you");
        if (!form.message.trim()) return toast.error("Please tell us what you'd like to cover");

        try {
            setLoading(true);
            const res = await Axios({
                ...SummeryApi.submitMeetingRequest,
                data: {
                    ...form,
                    preferredAt: form.preferredAt ? new Date(form.preferredAt).toISOString() : undefined,
                },
            });
            if (res.data?.success) {
                setDone(res.data.message || "Thanks — we'll call you to confirm a time.");
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Something went wrong — please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div onClick={onClose} className="fixed inset-0 bg-black/50 z-92" />
            <div className="fixed inset-0 md:inset-auto md:top-[6vh] md:left-1/2 md:-translate-x-1/2 w-full h-full md:w-120 md:h-auto md:max-w-[92vw] md:max-h-[88vh] overflow-y-auto bg-background rounded-none md:rounded-2xl shadow-2xl z-93">
                <div className="flex items-center justify-between px-6 py-5 border-b border-primary-hover sticky top-0 bg-background">
                    <div>
                        <h3 className="font-secondary text-xl text-text-hover">Book a meeting</h3>
                        <p className="text-sm text-text mt-0.5">Tell us a bit about your business — we'll call you.</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-text hover:text-text-hover shrink-0 ml-4">×</button>
                </div>

                <div className="p-6">
                    {done ? (
                        <div className="text-center py-4">
                            <div className="w-14 h-14 rounded-full bg-secondary-light text-secondary flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
                            <p className="text-text-hover font-medium mb-1">{done}</p>
                            <button onClick={onClose} className="mt-4 bg-secondary text-background rounded-full px-6 py-2.5 font-semibold text-sm">
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-text-hover mb-1.5">First name</label>
                                    <input
                                        value={form.firstName}
                                        onChange={set("firstName")}
                                        required
                                        className="w-full rounded-lg border border-primary-hover px-3.5 py-2.5 text-sm outline-none focus:border-secondary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-hover mb-1.5">Surname</label>
                                    <input
                                        value={form.lastName}
                                        onChange={set("lastName")}
                                        required
                                        className="w-full rounded-lg border border-primary-hover px-3.5 py-2.5 text-sm outline-none focus:border-secondary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-hover mb-1.5">Email address</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={set("email")}
                                    required
                                    className="w-full rounded-lg border border-primary-hover px-3.5 py-2.5 text-sm outline-none focus:border-secondary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-text-hover mb-1.5">Phone number</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={set("phone")}
                                        required
                                        placeholder="So we can call you"
                                        className="w-full rounded-lg border border-primary-hover px-3.5 py-2.5 text-sm outline-none focus:border-secondary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-hover mb-1.5">Company</label>
                                    <input
                                        value={form.company}
                                        onChange={set("company")}
                                        placeholder="Optional"
                                        className="w-full rounded-lg border border-primary-hover px-3.5 py-2.5 text-sm outline-none focus:border-secondary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-hover mb-1.5">Preferred date &amp; time</label>
                                <input
                                    type="datetime-local"
                                    value={form.preferredAt}
                                    onChange={set("preferredAt")}
                                    className="w-full rounded-lg border border-primary-hover px-3.5 py-2.5 text-sm outline-none focus:border-secondary"
                                />
                                <p className="text-xs text-text mt-1">A hint for our team, not a confirmed slot — we'll call to lock in a time.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-hover mb-1.5">What are you wanting to cover in this meeting?</label>
                                <textarea
                                    rows={3}
                                    value={form.message}
                                    onChange={set("message")}
                                    required
                                    className="w-full rounded-lg border border-primary-hover px-3.5 py-2.5 text-sm outline-none focus:border-secondary resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-secondary hover:bg-secondary-hover text-background rounded-full py-3 font-semibold text-sm transition-colors disabled:opacity-60"
                            >
                                {loading ? 'Sending…' : 'Book my meeting'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
