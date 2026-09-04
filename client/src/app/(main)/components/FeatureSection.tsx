"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import banner1 from "@/assets/banners/banner1.webp";
import banner2 from "@/assets/banners/banner2.webp";
import orderGif from "@/assets/home/feture-card1.png";
import tailored from "@/assets/home/tailored.avif";

const features = [
    {
        icon: "✦",
        title: "NDIS Claimable",
        desc: "Most products are fully claimable under NDIS supports.",
    },
    {
        icon: "📦",
        title: "Discreet Packaging",
        desc: "All orders shipped in plain, unmarked packaging.",
    },
    {
        icon: "🌿",
        title: "Clinically Backed",
        desc: "Recommended by continence nurses and health professionals.",
    },
    {
        icon: "🚚",
        title: "Australia-Wide Delivery",
        desc: "Fast, reliable shipping to every state and territory.",
    },
];

const FeatureSection = () => {
    return (
        <>
            {/* ─── Bento Grid ─── */}
            <section className="bg-[#f5f0eb] py-16">
                <div className="container mx-auto px-6">
                    {/* Section header */}
                    <div className="flex flex-col items-center text-center mb-10 gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Why Aidble
                        </p>
                        <h2 className="font-serif text-5xl md:text-6xl text-gray-900 tracking-tight leading-none">
                            Care that works.
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-[320px] mt-1">
                            Purpose-built products for continence care — trusted by families, carers, and NDIS participants across Australia.
                        </p>
                    </div>

                    {/* Bento grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-[auto] gap-3 md:gap-4 auto-rows-[220px]">

                        {/* Card 1 — large, spans 2 cols 2 rows — image bg */}
                        <div className="relative col-span-2 row-span-2 rounded-3xl overflow-hidden group">
                                        <video
                            className="object-cover transition-transform duration-700 h-full group-hover:scale-105"
                            src="/furture-bg1.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline

                        />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            <div className="absolute bottom-6 left-6 text-white">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70 mb-1">
                                    NDIS Registered
                                </p>
                                <p className="font-serif text-3xl md:text-4xl leading-tight">
                                    100% NDIS<br />Claimable
                                </p>
                            </div>
                        </div>
                         <div className="relative col-span-2 rounded-3xl overflow-hidden group">
                            <Image
                                src={orderGif}
                                alt="Registered NDIS Provider"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70 mb-1">
                                    Registered Provider
                                </p>
                                <p className="font-serif text-2xl md:text-3xl leading-tight">
                                    NDIS Approved<br />
                                    <span className="text-[#c9b89a] text-lg">& trusted nationwide</span>
                                </p>
                            </div>
                        </div>


                        {/* Card 3 — GIF / animated background */}
                        <div className="relative col-span-2 rounded-3xl overflow-hidden group">
                             <video
                            className="object-right transition-transform duration-700 h-full w-full group-hover:scale-105"
                            src="/furture-bg2.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline

                        />

                             <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                            <div>
                                <p className="font-serif text-lg leading-snug text-gray-900">
                                    Clinically<br />Backed
                                </p>
                                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                                    Recommended by continence nurses
                                </p>
                            </div>
                        </div>

                        {/* Card 4 — accent card */}
                        {/* <div className="col-span-1 rounded-3xl bg-[#e8ddd4] p-6 flex flex-col justify-between">
                            <div className="w-10 h-10 rounded-full bg-[#1a1a18] flex items-center justify-center text-white text-lg">
                                🌿
                            </div>
                            <div>
                                <p className="font-serif text-lg leading-snug text-gray-900">
                                    Clinically<br />Backed
                                </p>
                                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                                    Recommended by continence nurses
                                </p>
                            </div>
                        </div> */}

                        {/* Card 5 — image bg, wide */}


                    </div>
                </div>
            </section>

            {/* ─── Split Feature Highlight ─── */}
            <section className="bg-primary py-16 overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-10 items-center">

                        {/* Left — image */}
                        <div className="relative rounded-3xl overflow-hidden aspect-[4/5] max-h-[580px]">
                            <video
                            className="absolute inset-0 w-full h-full object-cover"
                            src="/hero-bg.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>

                        {/* Right — content */}
                        <div className="text-secondary flex flex-col gap-8">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary-hover mb-4">
                                    Why Aidble
                                </p>
                                <h2 className="font-serif text-5xl md:text-6xl text-secondary tracking-tight leading-none mb-4">
                                    Care that<br />breathes.
                                </h2>
                                <p className="text-text text-sm leading-relaxed max-w-[380px]">
                                    Every product is designed around real people — prioritising comfort, dignity, and confidence so you can live life on your own terms.
                                </p>
                            </div>

                            {/* 2×2 feature pills grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {features.map((f) => (
                                    <div
                                        key={f.title}
                                        className="bg-secondary/20 border border-secondary/10 rounded-2xl p-5 hover:bg-secondary/10 transition-colors duration-200"
                                    >
                                        <p className="text-xl mb-2">{f.icon}</p>
                                        <p className="font-semibold text-secondary text-sm mb-1">{f.title}</p>
                                        <p className="text-text text-xs leading-relaxed">{f.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/products"
                                className="inline-flex self-start items-center gap-2 bg-secondary text-background font-semibold text-sm px-6 py-3 rounded-full hover:bg-secondary-hover transition-colors duration-200"
                            >
                                Shop now
                                <span className="text-base">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default FeatureSection;