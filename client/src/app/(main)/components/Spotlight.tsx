import React from 'react'
import Link from 'next/link'

const FEATURES = [
    { title: 'Long lasting', sub: '30+ hours of clean burn' },
    { title: 'Premium fragrance', sub: 'Amber, vanilla, soft resin' },
    { title: 'Perfect for gifting', sub: 'Kraft box and card included' },
    { title: 'Reusable jar', sub: 'Keeps well as a holder' },
]

const Spotlight = () => {
    return (
        <section className="container mx-auto px-6 py-14">
            <div className="grid md:grid-cols-2 gap-10 items-center bg-primary p-9">
                <div className="aspect-square bg-[url('/touhfaye/placeholders/candle-amber.svg')] bg-cover bg-center" />
                <div>
                    <div className="text-[10.5px] tracking-[.24em] text-accent">SIGNATURE CANDLE</div>
                    <h2 className="font-secondary text-3xl md:text-4xl leading-tight mt-3 text-title">Premium Scented Candle</h2>
                    <p className="text-[14.5px] leading-relaxed text-foreground font-light mt-3 max-w-[46ch]">
                        Amber glass, brushed gold lid, warm vanilla-amber fragrance. ৳480 each, boxed and ready to give.
                    </p>
                    <div className="grid grid-cols-2 gap-5 mt-6">
                        {FEATURES.map((f) => (
                            <div key={f.title}>
                                <div className="text-[13.5px] text-title">{f.title}</div>
                                <div className="text-[12.5px] text-foreground font-light mt-1">{f.sub}</div>
                            </div>
                        ))}
                    </div>
                    <Link
                        href="/products?category=candles"
                        className="inline-block mt-7 border border-secondary text-secondary hover:bg-secondary hover:text-background px-7 py-3.5 text-[11px] tracking-[.18em] transition-colors"
                    >
                        SHOP CANDLES
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default Spotlight
