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

// Values below are lifted 1:1 from the design mock's testimonials section
// (colours, sizes, spacing) rather than the site's usual design tokens,
// since none of the tokens land on exactly the same hex the mock uses here.
const TestimonialCard = ({ t }: { t: Testimonial }) => (
    <div className="bg-background border border-primary-hover pt-7.5 px-7 pb-6.5 flex flex-col items-center text-center h-full">
        <div className="text-[15px] tracking-[.12em]" style={{ color: "#D2A93F" }}>
            {"★".repeat(Math.max(0, Math.min(5, t.rating || 5)))}
        </div>
        <p className="text-[14.5px] leading-[1.8] text-paragraph font-light mt-4.5">
            &ldquo;{t.quote}&rdquo;
        </p>
        <div className="flex items-center gap-3.5 mt-auto pt-6.5">
            <div className="text-right">
                <p className="text-[13.5px] text-title">— {t.name}</p>
                {t.location && (
                    <p className="text-[11.5px] text-accent mt-0.75 font-light">{t.location}</p>
                )}
            </div>
            <div
                className="w-13 h-13 rounded-full bg-primary flex items-center justify-center font-secondary text-xl text-accent flex-none"
                style={{ border: "1px solid #DCCFB6" }}
            >
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
            style={{ backgroundImage: "url('/touhfaye/testimonial-bg.jpg')", backgroundPosition: "60% 50%" }}
        >
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(90deg, rgba(9,22,15,.94) 0%, rgba(9,22,15,.8) 52%, rgba(9,22,15,.55) 100%)",
                }}
            />

            <div className="relative max-w-[1240px] mx-auto px-7 pt-16 pb-17">
                <div className="flex items-center justify-center gap-4.5">
                    <span className="h-px w-14" style={{ background: "#6B7A64" }} />
                    <span className="w-1.75 h-1.75 bg-accent-light rotate-45 flex-none" />
                    <h2 className="text-[32px] font-secondary font-normal text-center" style={{ color: "#F3E9D2" }}>
                        What our customers say
                    </h2>
                    <span className="w-1.75 h-1.75 bg-accent-light rotate-45 flex-none" />
                    <span className="h-px w-14" style={{ background: "#6B7A64" }} />
                </div>

                <div className="grid grid-cols-[36px_minmax(0,1fr)_36px] gap-5.5 items-center mt-9">
                    <button
                        onClick={prev}
                        aria-label="Previous testimonials"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] transition-colors hover:!border-accent-light"
                        style={{ border: "1px solid #4E6151", color: "#D8BE7E" }}
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
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] transition-colors hover:!border-accent-light"
                        style={{ border: "1px solid #4E6151", color: "#D8BE7E" }}
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
                                className="w-1.75 h-1.75 rounded-full transition-colors"
                                style={{ background: i === active ? "#8C6A28" : "#DCCFB6" }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default TestimonialsSection;
