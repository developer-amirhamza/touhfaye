"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';

interface Blog {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImage: string;
    category: string;
}

const JournalPreview = () => {
    const [posts, setPosts] = useState<Blog[]>([]);

    useEffect(() => {
        Axios({ ...SummeryApi.getAllBlogs, params: { page: 1, limit: 3 } })
            .then((res) => {
                if (res.data?.success) setPosts(res.data.data);
            })
            .catch(() => {});
    }, []);

    if (posts.length === 0) return null;

    return (
        <section className="container mx-auto px-6 py-16">
            <div className="flex justify-between items-baseline gap-5 flex-wrap mb-7">
                <div>
                    <h2 className="font-secondary text-3xl text-title">Product stories</h2>
                    <div className="text-[12.5px] text-accent font-light mt-1.5">Candle care, gifting notes and what happens in the studio</div>
                </div>
                <Link href="/blog" className="text-[11px] tracking-[.16em] border-b border-secondary text-secondary pb-1">
                    ALL STORIES
                </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                {posts.map((b) => (
                    <Link
                        key={b.id}
                        href={`/blog/${b.slug}`}
                        className="border border-primary-hover bg-background flex flex-col hover:border-accent transition-colors"
                    >
                        <div className="aspect-[16/10] bg-primary">
                            {b.featuredImage && (
                                <img src={b.featuredImage} alt={b.title} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="p-5 flex flex-col gap-2.5 flex-1">
                            {b.category && (
                                <span className="text-[10px] tracking-[.18em] text-accent">{b.category.toUpperCase()}</span>
                            )}
                            <div className="font-secondary text-lg leading-snug text-title">{b.title}</div>
                            {b.excerpt && <p className="text-[13px] leading-relaxed text-foreground font-light line-clamp-2">{b.excerpt}</p>}
                            <span className="text-[10.5px] tracking-[.18em] text-secondary mt-auto pt-2">READ →</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default JournalPreview;
