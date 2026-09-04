"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Axios from '@/utils/Axios'
import { SummeryApi } from '@/app/common/SummeryApi'

interface Blog {
    id: string
    title: string
    slug: string
    excerpt: string
    featuredImage: string
    category: string
    publishedAt: string
    readTime?: number
}

const meta = (blog: Blog) => {
    const date = blog.publishedAt
        ? new Date(blog.publishedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
        : ''
    return [`${blog.readTime ?? 5} min read`, date].filter(Boolean).join(' · ')
}

const CareGuidesSection = () => {
    const [blogs, setBlogs] = useState<Blog[]>([])

    useEffect(() => {
        Axios({ ...SummeryApi.getAllBlogs, params: { page: 1, limit: 4 } })
            .then((res) => {
                if (res.data?.success) setBlogs(res.data.data)
            })
            .catch(() => {})
    }, [])

    if (blogs.length === 0) return null

    const [featured, ...rest] = blogs

    return (
        <section className="py-20">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-end flex-wrap gap-4 mb-8">
                    <div>
                        <span className="bg-[#d8e8dc] text-secondary font-semibold rounded-full px-4.5 py-2 text-sm">
                            Blog &amp; Care Guides
                        </span>
                        <h2 className="font-secondary text-4xl md:text-5xl text-text-hover tracking-tight mt-3.5">
                            Incontinence care guides and advice
                        </h2>
                    </div>
                    <Link href="/blog" className="text-secondary font-semibold text-lg hover:text-secondary-hover transition-colors">
                        View all articles →
                    </Link>
                </div>

                <div className="grid lg:grid-cols-[1.25fr_1fr] gap-6 items-stretch">
                    <Link
                        href={`/blog/${featured.slug}`}
                        className="bg-white border border-primary-hover rounded-2xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
                    >
                        <div className="relative h-65 bg-[#d8e8dc] shrink-0">
                            {featured.featuredImage && (
                                <img src={featured.featuredImage} alt={featured.title} className="absolute inset-0 w-full h-full object-cover" />
                            )}
                            <span className="absolute top-4 left-4 bg-secondary text-background text-xs font-bold tracking-wider rounded-full px-3.5 py-1.5">
                                FEATURED
                            </span>
                        </div>
                        <div className="p-7 flex flex-col gap-2.5">
                            {featured.category && (
                                <span className="text-secondary font-semibold text-sm">{featured.category}</span>
                            )}
                            <h3 className="font-secondary text-title text-3xl leading-tight">{featured.title}</h3>
                            {featured.excerpt && (
                                <p className=" leading-relaxed line-clamp-2">{featured.excerpt}</p>
                            )}
                            <span className="text-sm text-text mt-1">
                                {meta(featured)} · <span className="text-secondary font-semibold">Read →</span>
                            </span>
                        </div>
                    </Link>

                    <div className="flex flex-col gap-4.5">
                        {rest.map((blog) => (
                            <Link
                                key={blog.id}
                                href={`/blog/${blog.slug}`}
                                className="bg-white border border-primary-hover rounded-2xl overflow-hidden flex flex-1 hover:shadow-lg transition-shadow"
                            >
                                <div className="relative w-30 shrink-0 bg-[#ece2d2]">
                                    {blog.featuredImage && (
                                        <img src={blog.featuredImage} alt={blog.title} className="absolute inset-0 w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="py-4.5 px-5 flex flex-col justify-center gap-1">
                                    {blog.category && (
                                        <span className="text-secondary font-semibold text-sm">{blog.category}</span>
                                    )}
                                    <span className="font-secondary text-xl text-title leading-tight line-clamp-2">{blog.title}</span>
                                    <span className="text-sm ">{meta(blog)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default CareGuidesSection
