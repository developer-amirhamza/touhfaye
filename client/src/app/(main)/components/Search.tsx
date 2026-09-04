"use client"
import React, { useEffect, useRef, useState } from 'react';
import { FaSearch, FaTimes } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud';
import { validURLConvert } from '@/utils/validURLConvart';

interface SearchHit {
    id: string;
    kind: string;
    title: string;
    sub: string;
    href: string;
}

interface BlogSummary {
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    category?: string;
}

const DEBOUNCE_MS = 300;

// Search icon that opens a full-width results overlay — mirrors the
// design's takeover search panel rather than the old per-page navigation.
const Search = () => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [hits, setHits] = useState<SearchHit[]>([]);
    const blogsRef = useRef<BlogSummary[] | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Lock page scroll while the overlay is open, and let Escape close it.
    useEffect(() => {
        if (!open) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handleKey);
        inputRef.current?.focus();
        return () => {
            document.body.style.overflow = prevOverflow;
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    useEffect(() => {
        const term = query.trim();
        if (term.length < 2) {
            setHits([]);
            return;
        }
        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const [productRes, blogs] = await Promise.all([
                    Axios({ ...SummeryApi.searchProduct, params: { q: term, page: 1, limit: 4 } }),
                    blogsRef.current
                        ? Promise.resolve(blogsRef.current)
                        : Axios({ ...SummeryApi.getAllBlogs, params: { limit: 50 } })
                            .then((res) => {
                                const list: BlogSummary[] = res.data?.data || [];
                                blogsRef.current = list;
                                return list;
                            })
                            .catch(() => []),
                ]);

                const productHits: SearchHit[] = (productRes.data?.data || []).map((p: any) => ({
                    id: p.id,
                    kind: 'Product',
                    title: p.title,
                    sub: [DisplayPriceInAud(p.price), p.sizes?.length ? p.sizes.join(', ') : null]
                        .filter(Boolean)
                        .join(' · '),
                    href: `/product/${validURLConvert(p.title)}_${p.id}`,
                }));

                const lowerTerm = term.toLowerCase();
                const blogHits: SearchHit[] = (blogs as BlogSummary[])
                    .filter((b) => b.title.toLowerCase().includes(lowerTerm) || b.excerpt?.toLowerCase().includes(lowerTerm))
                    .slice(0, 4)
                    .map((b) => ({
                        id: b.id,
                        kind: b.category || 'Blog',
                        title: b.title,
                        sub: b.excerpt || '',
                        href: `/blog/${b.slug}`,
                    }));

                setHits([...productHits, ...blogHits]);
            } catch {
                setHits([]);
            } finally {
                setLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [query]);

    const close = () => {
        setOpen(false);
        setQuery('');
        setHits([]);
    };

    const goTo = (href: string) => {
        close();
        router.push(href);
    };

    const term = query.trim();
    const showIdle = term.length < 2;
    const showEmpty = !showIdle && !loading && hits.length === 0;
    const showHits = !showIdle && hits.length > 0;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="Open search"
            >
                <FaSearch size={18} />
            </button>

            {open && (
                <>
                    <div
                        onClick={close}
                        className="fixed inset-0 bg-black/45 z-[90] transition-opacity"
                    />
                    <div className="fixed top-0 inset-x-0 bg-background z-[91] shadow-2xl">
                        <div className="max-w-[900px] mx-auto px-5 sm:px-7 pt-6 pb-8">
                            <div className="flex items-center gap-3 border-b-2 border-secondary pb-3">
                                <FaSearch className="text-secondary" size={18} />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search products and care guides"
                                    className="flex-1 bg-transparent outline-none text-lg sm:text-xl text-text-hover"
                                />
                                <button onClick={close} aria-label="Close search" className="text-2xl text-text p-1">
                                    <FaTimes />
                                </button>
                            </div>

                            {showIdle && (
                                <div className="pt-5 text-base text-text">
                                    Try &ldquo;pull up pants&rdquo;, &ldquo;NDIS&rdquo;, &ldquo;overnight&rdquo; or &ldquo;sizing&rdquo;.
                                </div>
                            )}
                            {showEmpty && (
                                <div className="pt-5 text-base text-text">
                                    Nothing matched &ldquo;{term}&rdquo;. Try a simpler word.
                                </div>
                            )}
                            {showHits && (
                                <div className="pt-4">
                                    <div className="text-sm text-text mb-2.5 tracking-wide">
                                        {hits.length} result{hits.length === 1 ? '' : 's'}
                                    </div>
                                    <div className="flex flex-col gap-2 max-h-[46vh] overflow-y-auto">
                                        {hits.map((h) => (
                                            <button
                                                key={`${h.kind}-${h.id}`}
                                                onClick={() => goTo(h.href)}
                                                className="text-left flex items-center gap-4 p-3.5 rounded-xl bg-white border border-primary-hover hover:border-secondary transition-colors"
                                            >
                                                <span className="bg-primary text-secondary text-xs font-bold rounded-full px-3 py-1.5 whitespace-nowrap">
                                                    {h.kind}
                                                </span>
                                                <span className="flex-1 min-w-0">
                                                    <span className="block text-lg font-semibold text-text-hover truncate">{h.title}</span>
                                                    {h.sub && <span className="block text-sm text-text truncate">{h.sub}</span>}
                                                </span>
                                                <span className="text-secondary text-xl shrink-0">→</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default Search
