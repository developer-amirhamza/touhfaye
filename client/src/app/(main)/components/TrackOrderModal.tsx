"use client"
import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud';
import { format } from 'date-fns';

interface TrackedOrder {
    orderNumber: string;
    orderStatus: string;
    createdAt: string;
    total: number;
    items: { id: string }[];
}

interface Props {
    onClose: () => void;
}

const STATUS_STYLES: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-800',
    Processing: 'bg-blue-100 text-blue-800',
    Shipped: 'bg-indigo-100 text-indigo-800',
    Delivered: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
};

// The reference design's Track Order modal asks for the order number
// alone — but the lookup endpoint intentionally also requires the email
// on the order (order numbers are sequential, so number-only lookup would
// let anyone enumerate other customers' orders). Both fields are kept.
const TrackOrderModal: React.FC<Props> = ({ onClose }) => {
    const [orderNumber, setOrderNumber] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [order, setOrder] = useState<TrackedOrder | null>(null);

    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderNumber.trim() || !email.trim()) return;
        try {
            setLoading(true);
            setError('');
            setOrder(null);
            const response = await Axios({
                ...SummeryApi.fetchOrderByNumber,
                params: { orderNumber: orderNumber.trim(), email: email.trim() },
            });
            if (response.data?.success) {
                setOrder(response.data.data);
            } else {
                setError(response.data?.message || "We couldn't find that order.");
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "We couldn't find an order with that number and email. Double-check both and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div onClick={onClose} className="fixed inset-0 bg-black/45 z-[90]" />
            <div className="fixed inset-0 md:inset-auto md:top-[12vh] md:left-1/2 md:-translate-x-1/2 w-full h-full md:w-[520px] md:h-auto md:max-w-[94vw] bg-background rounded-none md:rounded-2xl shadow-2xl z-[91] overflow-y-auto">
                <div className="px-6 py-5 border-b border-primary-hover flex items-start gap-4">
                    <div className="flex-1">
                        <div className="text-sm text-text tracking-wide">TRACK ORDER</div>
                        <div className="font-secondary text-2xl mt-0.5 text-text-hover">Where is my order?</div>
                    </div>
                    <button onClick={onClose} aria-label="Close tracking" className="text-2xl text-text leading-none p-1">
                        <FaTimes />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-3">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-text-hover">Order number</label>
                        <input
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                            placeholder="e.g. ORD-20260804-001"
                            className="w-full border border-primary-hover bg-white rounded-xl px-4 py-3 text-base outline-none focus:border-secondary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-text-hover">Email used on the order</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full border border-primary-hover bg-white rounded-xl px-4 py-3 text-base outline-none focus:border-secondary"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !orderNumber.trim() || !email.trim()}
                        className="mt-1 bg-secondary hover:bg-secondary-hover disabled:bg-gray-300 text-background font-semibold rounded-xl py-3 text-base transition-colors"
                    >
                        {loading ? 'Tracking…' : 'Track order'}
                    </button>

                    {!order && !error && (
                        <div className="text-sm text-text leading-relaxed mt-1">
                            Both are in the confirmation email we sent you. No email? Call 1300 243 253 and we&apos;ll find it.
                        </div>
                    )}
                    {error && (
                        <div className="text-sm text-red-700 leading-relaxed mt-1">{error}</div>
                    )}
                    {order && (
                        <div className="mt-3 bg-white border border-primary-hover rounded-2xl p-5">
                            <div className="flex justify-between items-baseline gap-3 flex-wrap">
                                <b className="text-lg text-text-hover">{order.orderNumber}</b>
                                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLES[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
                                    {order.orderStatus}
                                </span>
                            </div>
                            <div className="mt-3 text-sm text-text flex flex-col gap-1">
                                <span>Placed {format(new Date(order.createdAt), 'd MMM yyyy')}</span>
                                <span>{order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'} · {DisplayPriceInAud(order.total)}</span>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </>
    );
};

export default TrackOrderModal;
