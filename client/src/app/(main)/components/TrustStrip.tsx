import React from 'react'

const ITEMS = [
    { title: 'Hand-poured', sub: 'Small batches, soy blend' },
    { title: 'Gift wrap free', sub: 'Handwritten card included' },
    { title: 'Cash on delivery', sub: 'bKash and Nagad too' },
    { title: 'Nationwide courier', sub: 'Dhaka in 1–2 days' },
]

const TrustStrip = () => {
    return (
        <section className="bg-secondary text-secondary-light py-6">
            <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                {ITEMS.map((item) => (
                    <div key={item.title}>
                        <div className="text-[13.5px] text-background">{item.title}</div>
                        <div className="text-[11.5px] text-secondary-light/70 mt-1 font-light">{item.sub}</div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default TrustStrip
