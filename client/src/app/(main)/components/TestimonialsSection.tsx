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
    <div className="bg-background p-7 pb-6.5 flex flex-col items-center text-center h-full">
        <div className="text-accent-light text-sm tracking-[.12em]">
            {"★".repeat(Math.max(0, Math.min(5, t.rating || 5)))}
        </div>
        <p className="text-[15px] leading-[1.8] text-paragraph font-light mt-4.5">
            &ldquo;{t.quote}&rdquo;
        </p>
        <div className="flex items-center gap-3.5 mt-auto pt-6.5">
            <div className="text-right">
                <p className="text-[13.5px] text-title">{t.name}</p>
                {t.location && (
                    <p className="text-[11.5px] text-accent mt-0.5 font-light">{t.location}</p>
                )}
            </div>
            <div className="w-13 h-13 rounded-full bg-primary border border-primary-hover flex items-center justify-center font-secondary text-xl text-accent flex-none">
                {t.name.trim().charAt(0).toUpperCase()}
            </div>
        </div>
    </div>
);

const TestimonialsSection = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState(0);

    useEffect(() => {
        Axios({ ...SummeryApi.getTestimonials })
            .then((res) => {
                if (res.data?.success) setTestimonials(res.data.data || []);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return null;
    if (testimonials.length === 0) return null;

    const count = testimonials.length;
    const visible = [0, 1, 2].map((offset) => testimonials[(active + offset) % count]);
    const prev = () => setActive((i) => (i - 1 + count) % count);
    const next = () => setActive((i) => (i + 1) % count);

    return (
        <section
            className="relative mt-19 bg-secondary bg-cover"
            style={{ backgroundImage: "url('/touhfaye/testimonial-bg.jpg')", backgroundPosition: "center 62%" }}
        >
            <div className="absolute inset-0 bg-[rgba(10,22,16,.62)]" />

            <div className="relative container mx-auto px-6 py-16">
                <div className="flex items-center justify-center gap-4.5">
                    <span className="h-px w-14 bg-secondary-hover" />
                    <span className="w-1.5 h-1.5 bg-accent-light rotate-45 flex-none" />
                    <h2 className="text-3xl lg:text-4xl font-secondary text-background tracking-tight text-center">
                        What our customers say
                    </h2>
                    <span className="w-1.5 h-1.5 bg-accent-light rotate-45 flex-none" />
                    <span className="h-px w-14 bg-secondary-hover" />
                </div>

                <div className="grid grid-cols-[36px_minmax(0,1fr)_36px] gap-5 items-center mt-9">
                    <button
                        onClick={prev}
                        aria-label="Previous testimonials"
                        className="w-9 h-9 rounded-full border border-secondary-hover text-accent-light flex items-center justify-center hover:border-accent-light transition-colors"
                    >
                        ‹
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5.5">
                        {visible.map((t, idx) => (
                            <div key={`${t.id}-${idx}`} className={idx === 1 ? "hidden md:block" : idx === 2 ? "hidden lg:block" : ""}>
                                <TestimonialCard t={t} />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={next}
                        aria-label="Next testimonials"
                        className="w-9 h-9 rounded-full border border-secondary-hover text-accent-light flex items-center justify-center hover:border-accent-light transition-colors"
                    >
                        ›
                    </button>
                </div>

                {count > 1 && (
                    <div className="flex justify-center gap-2 mt-7">
                        {testimonials.map((t, i) => (
                            <button
                                key={t.id}
                                onClick={() => setActive(i)}
                                aria-label={`Show testimonials starting from ${t.name}`}
                                className={`w-1.75 h-1.75 rounded-full transition-colors ${i === active ? "bg-accent-light" : "bg-secondary-hover"}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default TestimonialsSection;
