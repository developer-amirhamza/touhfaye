"use client"
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { youarenotalone } from '@/config/page'
import articleHero from '@/assets/blog/article-hero.png'

const YouAreNotAlone = () => {
    const { badge, heading, intro, stats, carousel, cta } = youarenotalone
    const { heading: carouselHeading, subtitle, cardSuggestLabel, cardCtaLabel, slides } = carousel

    const [index, setIndex] = useState(0)
    const total = slides.length

    const goPrev = () => setIndex((i) => (i - 1 + total) % total)
    const goNext = () => setIndex((i) => (i + 1) % total)

    return (
        <section className="container mx-auto px-6 mb-20">
            <div className="bg-secondary rounded-3xl p-8 md:p-14 text-background">
                <div className="max-w-2xl mb-10">
                    <span className="bg-white/15 font-semibold rounded-full px-4.5 py-2 text-sm">{badge}</span>
                    <h2 className="font-secondary text-4xl md:text-5xl leading-tight mt-4 mb-3">{heading}</h2>
                    <p className="text-lg text-background/85">{intro}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {stats.map((s) => (
                        <div key={s.value} className="bg-white/10 rounded-2xl p-6">
                            <p className="font-secondary text-3xl md:text-4xl mb-2.5">{s.value}</p>
                            <p className="text-sm md:text-base text-background/85 leading-snug">{s.description}</p>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-end gap-5 flex-wrap mb-5">
                    <div>
                        <h3 className="font-secondary text-2xl md:text-3xl leading-tight">{carouselHeading}</h3>
                        <p className="text-background/75 mt-1">{subtitle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-background/70">{index + 1} of {total}</span>
                        <button
                            onClick={goPrev}
                            aria-label="Previous card"
                            className="w-11 h-11 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            ←
                        </button>
                        <button
                            onClick={goNext}
                            aria-label="Next card"
                            className="w-11 h-11 rounded-full bg-white text-secondary flex items-center justify-center hover:bg-primary transition-colors"
                        >
                            →
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl">
                    <div
                        className="flex transition-transform duration-400 ease-out"
                        style={{ transform: `translateX(-${index * 100}%)` }}
                    >
                        {slides.map((slide) => (
                            <div key={slide.title} className="w-full shrink-0 px-0.5">
                                <div className="bg-white/10 rounded-2xl p-6 md:p-8 grid md:grid-cols-[1fr_210px] gap-6 items-center min-h-52.5">
                                    <div>
                                        <span className="bg-white/15 rounded-full px-3.5 py-1.5 text-sm font-semibold">
                                            {slide.tag}
                                        </span>
                                        <h4 className="font-secondary text-2xl md:text-3xl leading-tight mt-3 mb-2.5">
                                            {slide.title}
                                        </h4>
                                        <p className="text-background/85 max-w-[62ch] leading-relaxed">{slide.body}</p>
                                    </div>
                                    <Link
                                        href="/products"
                                        className="text-left bg-white text-text-hover rounded-xl p-4 w-full block hover:bg-primary transition-colors"
                                    >
                                        <div className="h-23 rounded-lg overflow-hidden relative bg-secondary-light flex items-center justify-center">
                                            {slide.hasPhoto ? (
                                                <Image src={articleHero} alt="" fill sizes="210px" className="object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold tracking-wider text-secondary/30">PHOTO</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-text tracking-wide mt-2.5">{cardSuggestLabel}</p>
                                        <p className="text-sm font-semibold leading-snug line-clamp-2 mt-0.5">
                                            {slide.suggestedProduct}
                                        </p>
                                        <p className="text-sm font-semibold text-secondary mt-2">{cardCtaLabel}</p>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-1.5 justify-center mt-5">
                    {slides.map((slide, i) => (
                        <button
                            key={slide.title}
                            onClick={() => setIndex(i)}
                            aria-label={`Go to card ${i + 1}`}
                            className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/35'}`}
                        />
                    ))}
                </div>

                <div className="flex justify-center mt-8">
                    <Link
                        href="/products"
                        className="bg-white hover:bg-primary text-secondary font-bold rounded-full px-10 py-4 transition-colors"
                    >
                        {cta.label}
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default YouAreNotAlone
