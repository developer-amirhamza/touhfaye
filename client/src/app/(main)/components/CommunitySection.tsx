"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import Image, { StaticImageData } from 'next/image'
import { FaFacebookF, FaInstagram } from 'react-icons/fa'
import { FaTiktok } from 'react-icons/fa6'
import shelfPhoto from '@/assets/social/post-packs-shelf.webp'
import rangePhoto from '@/assets/social/post-range-pharmacy.png'

type Platform = 'Instagram' | 'Facebook' | 'TikTok'
type Media =
    | { kind: 'video'; src: string }
    | { kind: 'video-placeholder' }
    | { kind: 'image'; src: StaticImageData; alt: string }
    | { kind: 'swatch' }

interface SocialPost {
    id: string
    platform: Platform
    handle: string
    cap: string
    body: string
    tag: string
    swatch: string
    media: Media
}

// Illustrative brand content matching the design mock — not live engagement
// data, so no like/comment counts or post dates are shown as if real.
const POSTS: SocialPost[] = [
    { id: 'discreet-delivery', platform: 'Instagram', handle: '@mybestiee', tag: '#DiscreetDelivery', swatch: '#d8e8dc',
        cap: 'Discreet on the outside. Confident on the inside. Every Bestiee order ships in plain, unmarked packaging.',
        body: 'We get asked about our packaging more than anything else. So here it is: a plain box, no branding, no product names, nothing on the label that says what is inside. Your order looks like any other parcel on the doorstep.',
        media: { kind: 'image', src: shelfPhoto, alt: 'Bestiee Active packs on a kitchen bench' } },
    { id: 'incontinence-tips', platform: 'TikTok', handle: '@mybestiee', tag: '#IncontinenceTips', swatch: '#ece2d2',
        cap: 'Pads or pull up pants? 30 seconds to work out which one you actually need.',
        body: 'Pads sit inside your own underwear and suit light to moderate needs. Pull up pants replace underwear and hold more, which is usually the answer overnight. Most people end up using both.',
        media: { kind: 'video', src: '/social/video-1.mp4' } },
    { id: 'support-at-home', platform: 'Facebook', handle: 'Bestiee Australia', tag: '#SupportAtHome', swatch: '#dbe2ea',
        cap: 'Big news for carers: continence products are claimable under Support at Home. Here is how to use your funding.',
        body: 'Support at Home replaced the older home care packages, and continence supplies sit under assistive products and consumables. Your provider can order on your behalf and we invoice them directly.',
        media: { kind: 'image', src: rangePhoto, alt: 'The Bestiee range on a pharmacy shelf' } },
    { id: 'absorbency-guide', platform: 'Instagram', handle: '@mybestiee', tag: '#AbsorbencyGuide', swatch: '#ece2d2',
        cap: 'Absorbency levels, explained without the jargon. Save this one for your next order.',
        body: 'Light is for occasional small leaks. Moderate covers a few changes a day and is where most people start. Heavy or overnight is for full release or a full night of cover. Count your daily changes first, then pick.',
        media: { kind: 'video', src: '/social/video-2.mp4' } },
    { id: 'sizing-guide', platform: 'TikTok', handle: '@mybestiee', tag: '#SizingGuide', swatch: '#d8e8dc',
        cap: 'How to measure for the right size in under a minute. A snug fit is what stops leaks.',
        body: 'Measure around the widest part of your hips, standing up, with a soft tape. M is 80 to 110cm, L is 100 to 135cm, XL is 130 to 170cm. Between two sizes? Take the smaller one for a firmer seal.',
        media: { kind: 'video', src: '/social/video-3.mp4' } },
    { id: 'ndis-provider', platform: 'Facebook', handle: 'Bestiee Australia', tag: '#NDISProvider', swatch: '#dbe2ea',
        cap: 'Registered NDIS provider. Itemised quotes back the same business day, every time.',
        body: 'Send us the participant name, the products and the period you need covered. We return a branded, itemised quote ready to forward to a plan manager or coordinator, usually the same business day.',
        media: { kind: 'swatch' } },
    { id: 'carer-support', platform: 'Instagram', handle: '@mybestiee', tag: '#CarerSupport', swatch: '#dbe2ea',
        cap: 'A carer asked how to start the conversation. Our honest answer: ask, do not announce.',
        body: 'This conversation is rarely about the products. It is about someone feeling they are losing control of something private. Pick a calm moment, keep it short, use plain words, and let them make the final choice.',
        media: { kind: 'video', src: '/social/video-4.mp4' } },
    { id: 'overnight-protection', platform: 'TikTok', handle: '@mybestiee', tag: '#OvernightProtection', swatch: '#ece2d2',
        cap: 'Night routine that actually gets everyone a full night of sleep.',
        body: 'Using a day product overnight is the number one cause of broken sleep. Use an overnight rated product, add a waterproof bed pad as insurance, and check the leg seal before lights out.',
        media: { kind: 'video', src: '/social/video-5.mp4' } },
    { id: 'australia-wide', platform: 'Facebook', handle: 'Bestiee Australia', tag: '#AustraliaWide', swatch: '#d8e8dc',
        cap: 'Free discreet delivery Australia wide on every order over $99.',
        body: 'Orders over $99 ship free anywhere in Australia. Everything goes out in plain unmarked packaging, and we dispatch same day on weekdays when you order before 2pm AEST.',
        media: { kind: 'swatch' } },
]

const PLATFORM_ICON: Record<Platform, React.ReactNode> = {
    Instagram: <FaInstagram />,
    Facebook: <FaFacebookF />,
    TikTok: <FaTiktok />,
}

// Only accounts already published elsewhere on the real site (footer) get a
// real follow link — no destination is invented for platforms without one.
const PLATFORM_URL: Partial<Record<Platform, string>> = {
    Facebook: 'https://www.facebook.com/aubestiee/',
    Instagram: 'https://www.instagram.com/bestieeau/',
    TikTok: 'https://www.tiktok.com/@actualbestiee0',
}

const TABS: Array<'All' | Platform> = ['All', 'Instagram', 'Facebook', 'TikTok']

function PostMedia({ post, controls }: { post: SocialPost; controls: boolean }) {
    if (post.media.kind === 'video') {
        return (
            <video
                src={post.media.src}
                muted
                loop
                autoPlay
                playsInline
                controls={controls}
                className="absolute inset-0 w-full h-full object-cover"
            />
        )
    }
    if (post.media.kind === 'image') {
        return <Image src={post.media.src} alt={post.media.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
    }
    return (
        <div className="absolute inset-0 flex items-center justify-center text-3xl text-secondary/25">
            {PLATFORM_ICON[post.platform]}
        </div>
    )
}

const CommunitySection = () => {
    const [tab, setTab] = useState<'All' | Platform>('All')
    const [activePost, setActivePost] = useState<SocialPost | null>(null)

    const visible = tab === 'All' ? POSTS : POSTS.filter((p) => p.platform === tab)

    return (
        <section id="social" className="py-20">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
                    <div>
                        <span className="bg-[#d8e8dc] text-secondary font-semibold rounded-full px-4.5 py-2 text-sm">
                            @mybestiee
                        </span>
                        <h2 className="font-secondary text-4xl md:text-5xl text-text-hover tracking-tight mt-3.5">
                            Follow Bestiee
                        </h2>
                        <p className="text-base md:text-lg text-text mt-2">
                            Incontinence care tips, product guides and NDIS news, every week.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {(['Instagram', 'Facebook', 'TikTok'] as Platform[]).map((platform) =>
                            PLATFORM_URL[platform] ? (
                                <a
                                    key={platform}
                                    href={PLATFORM_URL[platform]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 border border-primary-hover rounded-full px-5 py-2.5 font-semibold text-sm text-text-hover hover:border-secondary transition-colors"
                                >
                                    <span className="text-secondary">{PLATFORM_ICON[platform]}</span> {platform}
                                </a>
                            ) : (
                                <span
                                    key={platform}
                                    className="flex items-center gap-2 border border-primary-hover rounded-full px-5 py-2.5 font-semibold text-sm text-text-hover"
                                >
                                    <span className="text-secondary">{PLATFORM_ICON[platform]}</span> {platform}
                                </span>
                            )
                        )}
                    </div>
                </div>

                <div className="flex gap-2.5 flex-wrap items-center mb-6">
                    {TABS.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`font-semibold rounded-full px-5 py-2 text-sm border transition-colors ${
                                tab === t
                                    ? 'bg-secondary text-background border-secondary'
                                    : 'bg-white text-text-hover border-primary-hover hover:border-secondary'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                    <span className="text-sm text-text ml-1.5">{visible.length} posts</span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {visible.map((post) => (
                        <button
                            key={post.id}
                            onClick={() => setActivePost(post)}
                            className="text-left bg-white border border-primary-hover rounded-2xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
                        >
                            <div className="relative w-full overflow-hidden" style={{ height: 250, backgroundColor: post.swatch }}>
                                <span className="absolute top-3 left-3 z-10 bg-white/95 text-secondary font-bold text-sm rounded-full px-3.5 py-1.5 flex items-center gap-1.5">
                                    {PLATFORM_ICON[post.platform]} {post.platform}
                                </span>
                                <PostMedia post={post} controls={false} />
                            </div>
                            <div className="p-5 flex flex-col gap-2 flex-1">
                                <span className="text-base text-text-hover leading-snug">{post.cap}</span>
                                <span className="text-sm text-secondary font-semibold mt-auto">{post.tag}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {activePost && (
                <>
                    <div
                        onClick={() => setActivePost(null)}
                        className="fixed inset-0 bg-black/50 z-92"
                    />
                    <div className="fixed top-[6vh] left-1/2 -translate-x-1/2 w-215 max-w-[94vw] max-h-[88vh] bg-background rounded-[22px] z-93 shadow-2xl overflow-hidden flex flex-col md:flex-row">
                        <div className="relative w-full md:w-[46%] h-70 md:h-auto shrink-0" style={{ backgroundColor: activePost.swatch }}>
                            <PostMedia post={activePost} controls />
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="flex items-center gap-3 px-6 py-5 border-b border-primary-hover">
                                <span className="w-10.5 h-10.5 rounded-full bg-[#d8e8dc] text-secondary flex items-center justify-center text-lg shrink-0">
                                    {PLATFORM_ICON[activePost.platform]}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-lg text-text-hover">{activePost.handle}</div>
                                    <div className="text-sm text-text">{activePost.platform}</div>
                                </div>
                                <button
                                    onClick={() => setActivePost(null)}
                                    aria-label="Close post"
                                    className="text-3xl leading-none text-text hover:text-text-hover"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3.5">
                                <p className="text-lg leading-snug font-medium text-text-hover m-0">{activePost.cap}</p>
                                <p className="text-base leading-relaxed text-text m-0">{activePost.body}</p>
                                <span className="text-secondary font-semibold text-base">{activePost.tag}</span>
                            </div>
                            <div className="border-t border-primary-hover px-6 py-4.5 flex gap-3">
                                {PLATFORM_URL[activePost.platform] ? (
                                    <a
                                        href={PLATFORM_URL[activePost.platform]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 text-center bg-secondary hover:bg-secondary-hover text-background font-semibold rounded-full py-3 text-base transition-colors"
                                    >
                                        Follow on {activePost.platform}
                                    </a>
                                ) : (
                                    <span className="flex-1 text-center bg-secondary/40 text-background font-semibold rounded-full py-3 text-base cursor-default">
                                        Follow on {activePost.platform}
                                    </span>
                                )}
                                <Link
                                    href="/products"
                                    className="border border-primary-hover rounded-full px-5 py-3 font-semibold text-sm text-text-hover hover:border-secondary transition-colors"
                                >
                                    Find my product
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </section>
    )
}

export default CommunitySection
