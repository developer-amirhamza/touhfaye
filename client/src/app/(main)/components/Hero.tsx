"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { FaPhoneAlt, FaTimes } from 'react-icons/fa'

const CHECKS = [
    'NDIS and Support at Home claimable',
    'Discreet packaging, Australia wide',
    'Easy to use platform',
    'Easy to use invoicing',
]

const VLOG_ITEMS = [
    { title: 'Pads or pull up pants?', src: '/social/video-1.mp4' },
    { title: 'Absorbency levels explained', src: '/social/video-2.mp4' },
    { title: 'Measure for the right size', src: '/social/video-3.mp4' },
    { title: 'A night routine that works', src: '/social/video-5.mp4' },
]

const Hero = () => {
    const [playing, setPlaying] = useState<string | null>(null)

    return (
        <section className="relative py-5  w-full overflow-hidden bg-secondary text-background">
            {/* Background video */}
            <video
                className="absolute inset-0 w-full h-full object-cover"
                src="/social/section-ad.mp4"
                autoPlay
                loop
                muted
                playsInline
            />
            <div className="absolute inset-0 bg-secondary/80" />
            <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_12%_40%,rgba(0,0,0,.42),transparent_60%)]" />

            <div className="relative z-10 container mx-auto px-6 py-14 lg:py-24 flex flex-col lg:flex-row gap-10 lg:gap-12 lg:items-center">
                {/* Text content */}
                <div className="w-full lg:flex-1 lg:max-w-2xl flex flex-col gap-6">
                    <span className="self-start bg-white/16 text-background text-sm font-semibold rounded-full px-4.5 py-2">
                        Dignified continence care
                    </span>

                    <h1 className="font-secondary leading-[0.95] tracking-tight text-4xl md:text-5xl lg:text-7xl">
                        Care gently.<br />
                        Live freely.
                    </h1>

                    <p className="text-background/90 text-base sm:text-lg leading-relaxed max-w-md">
                        Premium continence products, delivered discreetly to your door. Pure comfort, gentle dignity, confident days — fully NDIS claimable.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 max-w-lg">
                        {CHECKS.map((item) => (
                            <div key={item} className="flex gap-2.5 items-start text-sm sm:text-base leading-snug">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold mt-0.5">✓</span>
                                {item}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-6 items-center pt-2">
                        <Link
                            href="/products"
                            className="flex items-center gap-2 bg-white hover:bg-primary text-secondary font-semibold px-7 py-3.5 rounded-full transition-colors text-base"
                        >
                            Shop products →
                        </Link>
                        <Link
                            href="/contact-us"
                            className="flex items-center gap-2 font-semibold underline decoration-[1.5px] underline-offset-4 hover:text-primary transition-colors text-base"
                        >
                            <FaPhoneAlt size={13} />
                            Talk to NDIS Support
                        </Link>
                    </div>
                </div>

                {/* Care tips + vlog cards */}
                <div className="w-full lg:flex-1 lg:max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                        href="/blog"
                        className="bg-white text-secondary rounded-2xl p-6 flex flex-col justify-between gap-4 aspect-square hover:-translate-y-1 transition-transform"
                    >
                        <div>
                            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-2xl">✚</div>
                            <div className="font-secondary text-2xl mt-4">Care tips</div>
                            <p className="text-text text-sm mt-2 leading-snug">
                                Absorbency, sizing, skin care and funding, in plain words.
                            </p>
                        </div>
                        <div className="text-sm font-semibold">Read the guides →</div>
                    </Link>

                    <div className="bg-white/10 rounded-2xl p-4 flex flex-col gap-2 aspect-square">
                        <div className="text-xs font-bold tracking-wider opacity-80 shrink-0">BESTIEE VLOG</div>
                        <div className="flex flex-col gap-1.5 flex-1 min-h-0">
                            {VLOG_ITEMS.map((v) => (
                                <button
                                    key={v.src}
                                    onClick={() => setPlaying(v.src)}
                                    className="flex items-center gap-2.5 text-left bg-white/10 hover:bg-white/15 rounded-lg px-2 py-1.5 flex-1 min-h-0 transition-colors"
                                >
                                    <span className="relative shrink-0 w-11 h-8 rounded-md overflow-hidden bg-black/25">
                                        <video
                                            src={v.src}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            muted
                                            loop
                                            autoPlay
                                            playsInline
                                            preload="metadata"
                                        />
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-xs font-semibold leading-tight truncate">{v.title}</span>
                                        <span className="block text-[11px] text-background/70">Tap to watch</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Vlog video modal */}
            {playing && (
                <>
                    <div onClick={() => setPlaying(null)} className="fixed inset-0 bg-black/70 z-[95]" />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-2xl z-[96]">
                        <button
                            onClick={() => setPlaying(null)}
                            aria-label="Close video"
                            className="absolute -top-10 right-0 text-white text-2xl p-1"
                        >
                            <FaTimes />
                        </button>
                        <video src={playing} className="w-full rounded-xl" controls autoPlay playsInline />
                    </div>
                </>
            )}
        </section>
    )
}

export default Hero
