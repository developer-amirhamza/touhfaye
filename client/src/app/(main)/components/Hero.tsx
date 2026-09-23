"use client"
import React from 'react'
import Link from 'next/link'

const Hero = () => {
    return (
        <section className="relative min-h-[560px] md:min-h-[640px] flex items-center overflow-hidden bg-primary">
            <video
                className="absolute inset-0 w-full h-full object-cover"
                src="/touhfaye/gift-box-1.mp4"
                autoPlay
                loop
                muted
                playsInline
            />
            <div className="absolute inset-0 bg-[#12281C]/35" />

            <div className="relative z-10 container mx-auto px-6 py-18 w-full">
                <div className="bg-background/65 backdrop-blur-xl border border-white/60 shadow-xl px-9 py-10 max-w-[460px]">
                    <span className="inline-block border border-accent-light text-accent text-[10px] tracking-[.2em] px-3 py-1.5">
                        NEW STOCK
                    </span>
                    <h1 className="font-secondary text-4xl sm:text-5xl leading-[1.08] mt-4 text-title">
                        Gifts that speak<br />from the heart
                    </h1>
                    <p className="text-[15px] leading-relaxed text-paragraph font-light mt-4">
                        Scented candles, printed mandala tins and gold-plated jewellery — hand-finished, wrapped with a written card, delivered across Bangladesh.
                    </p>
                    <div className="flex gap-3 mt-6 flex-wrap">
                        <Link
                            href="/products"
                            className="bg-secondary hover:bg-secondary-hover text-background px-8 py-4 text-[11px] tracking-[.18em] transition-colors"
                        >
                            SHOP THE COLLECTION
                        </Link>
                        <Link
                            href="/products?category=gift-sets"
                            className="border border-secondary text-secondary hover:bg-secondary/10 px-6 py-4 text-[11px] tracking-[.18em] transition-colors"
                        >
                            GIFT SETS
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero
