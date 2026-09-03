const WHY_CARDS = [
    {
        icon: "✚",
        title: "Fully NDIS and Support at Home claimable",
        body: "Most products are claimable under NDIS supports. We invoice your plan directly.",
    },
    {
        icon: "🌿",
        title: "Clinically backed",
        body: "Recommended by continence nurses and health professionals across Australia.",
    },
    {
        icon: "📦",
        title: "Always discreet",
        body: "Every order ships in plain, unmarked packaging. Private, from cart to door.",
    },
];

export default function NdisSupportSection() {
    return (
        <section id="ndis" className="py-20">
            <div className="container mx-auto px-6">
                <div className="flex flex-col items-center text-center gap-3 mb-10">
                    <span className="bg-[#d8e8dc] text-secondary font-semibold rounded-full px-4.5 py-2 text-sm">
                        Why Bestiee
                    </span>
                    <h2 className="font-secondary text-4xl md:text-5xl text-text-hover tracking-tight">
                        Care that works, care that lasts
                    </h2>
                    <p className="text-base md:text-lg text-text max-w-xl">
                        Australian owned incontinence products, claimable on NDIS and Support at Home.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {WHY_CARDS.map((c) => (
                        <div key={c.title} className="bg-white border border-primary-hover rounded-2xl p-8">
                            <div className="w-14 h-14 rounded-2xl bg-[#d8e8dc] flex items-center justify-center text-2xl mb-4.5">
                                {c.icon}
                            </div>
                            <h3 className="font-secondary text-2xl text-text-hover leading-tight mb-2">{c.title}</h3>
                            <p className="text-base text-text leading-relaxed">{c.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
