"use client";
import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";

interface Testimonial {
    id: string;
    name: string;
    role?: string;
    location?: string;
    quote: string;
    rating: number;
}

const TestimonialCard = ({ t }: { t: Testimonial }) => (
    <div className="bg-background rounded-none border border-primary-hover p-7 mb-5">
        <div className="text-accent-light text-sm tracking-[.12em]">{"★".repeat(Math.max(0, Math.min(5, t.rating || 5)))}</div>
        <p className="font-serif italic text-[19px] leading-relaxed text-paragraph mt-4 mb-6">
            &ldquo;{t.quote}&rdquo;
        </p>
        <div className="flex items-end justify-between gap-3">
            <div>
                <p className="font-medium text-title text-sm">{t.name}</p>
                {t.location && (
                    <p className="text-xs text-accent mt-0.5 font-light">{t.location}</p>
                )}
            </div>
            {t.role && (
                <span className="text-[11px] text-accent bg-primary px-3 py-1 whitespace-nowrap">
                    {t.role}
                </span>
            )}
        </div>
    </div>
);

const ScrollColumn = ({
    items,
    direction,
    duration,
}: {
    items: Testimonial[];
    direction: "up" | "down";
    duration: number;
}) => {
    if (items.length === 0) return null;
    const loop = [...items, ...items];
    return (
        <div className="relative overflow-hidden h-full">
            <div
                className="flex flex-col"
                style={{
                    animation: `testimonial-scroll-${direction} ${duration}s linear infinite`,
                }}
            >
                {loop.map((t, i) => (
                    <TestimonialCard key={`${t.id}-${i}`} t={t} />
                ))}
            </div>
        </div>
    );
};

const TestimonialsSection = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Axios({ ...SummeryApi.getTestimonials })
            .then((res) => {
                if (res.data?.success) setTestimonials(res.data.data || []);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return null;
    if (testimonials.length === 0) return null;

    const columns: Testimonial[][] = [[], [], []];
    testimonials.forEach((t, i) => columns[i % 3].push(t));

    const fill = (arr: Testimonial[]) => {
        if (arr.length === 0) return testimonials.slice(0, 3);
        const out = [...arr];
        while (out.length < 3) out.push(...arr);
        return out;
    };

    return (
        <section className="bg-secondary py-16 overflow-hidden">
            <style>{`
                @keyframes testimonial-scroll-up {
                    0%   { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                }
                @keyframes testimonial-scroll-down {
                    0%   { transform: translateY(-50%); }
                    100% { transform: translateY(0); }
                }
            `}</style>

            <div className="container mx-auto px-6">
                <div className="flex flex-col items-center text-center mb-12 gap-3">
                    <div className="flex items-center gap-4">
                        <span className="h-px w-14 bg-secondary-hover" />
                        <span className="w-1.5 h-1.5 bg-accent-light rotate-45" />
                        <h2 className="text-3xl lg:text-4xl font-secondary text-background tracking-tight">
                            What our customers say
                        </h2>
                        <span className="w-1.5 h-1.5 bg-accent-light rotate-45" />
                        <span className="h-px w-14 bg-secondary-hover" />
                    </div>
                </div>

                <div
                    className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 h-140"
                    style={{
                        maskImage:
                            "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
                        WebkitMaskImage:
                            "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
                    }}
                >
                    <ScrollColumn items={fill(columns[0])} direction="down" duration={32} />
                    <div className="hidden md:block h-full">
                        <ScrollColumn items={fill(columns[1])} direction="up" duration={38} />
                    </div>
                    <div className="hidden lg:block h-full">
                        <ScrollColumn items={fill(columns[2])} direction="down" duration={35} />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;