"use client";
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import Loader from '../../components/UI/Loader';
import Breadcrumb from '../../components/UI/Breadcrumb';
import FaqAccordion, { FaqItem } from '../../components/UI/FaqAccordion';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  publishedAt: string;
  readTime?: number;
  views: number;
}

const formatDate = (blog: Blog) =>
  blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

const readLabel = (blog: Blog) => `${blog.readTime ?? 5} min read`;

const BlogPage = () => {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader /></div>}>
      <BlogPageContent />
    </Suspense>
  );
};

const BlogPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(searchParams.get('category'));
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  useEffect(() => {
    Axios({ ...SummeryApi.getFaqs, params: { surface: 'BLOG_LIST' } })
      .then((res) => {
        if (res.data?.success) setFaqs(res.data.data);
      })
      .catch(() => { /* embedded FAQs are optional — fail silently */ });
  }, []);

  // Derive the category tab list once from a broader sample of posts —
  // there's no fixed enum for category, it's free text on the Blog model.
  useEffect(() => {
    Axios({ ...SummeryApi.getAllBlogs, params: { page: 1, limit: 100 } })
      .then((res) => {
        if (res.data?.success) {
          const distinct = Array.from(new Set(res.data.data.map((b: Blog) => b.category).filter(Boolean))) as string[];
          setCategories(distinct);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Axios({ ...SummeryApi.getAllBlogs, params: { page, limit: 9, ...(category ? { category } : {}) } })
      .then((res) => {
        if (res.data?.success) {
          setBlogs(res.data.data);
          setTotalPages(res.data.pagination.totalPages || 1);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, category]);

  const selectCategory = (c: string | null) => {
    setCategory(c);
    setPage(1);
    router.replace(c ? `/blog?category=${encodeURIComponent(c)}` : '/blog');
  };

  const lead = blogs[0];
  const rest = blogs.slice(1);

  const storyCount = blogs.length + (blogs.length === 1 ? ' story' : ' stories');

  const CardImage = ({ blog }: { blog: Blog }) => (
    <div className="relative bg-primary overflow-hidden" style={{ aspectRatio: '16/10' }}>
      {blog.featuredImage ? (
        <img src={blog.featuredImage} alt={blog.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-title/20 text-4xl font-secondary">
          {blog.title[0]}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className="max-w-310 mx-auto px-5 sm:px-7 pt-10 pb-7.5 grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-8 md:gap-11 items-end">
        <div>
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Stories' }]} />
          <h1 className="font-secondary text-4xl md:text-5xl lg:text-[56px] leading-[1.04] text-title mt-3">
            Product stories
          </h1>
        </div>
        <p className="text-[15px] leading-[1.75] text-foreground font-light max-w-[44ch] mb-1.5">
          Notes on burning a candle properly, choosing a gift for someone you hardly know, and what happens on our packing table before a parcel leaves.
        </p>
      </section>

      {/* Category tabs + count */}
      <div className="max-w-310 mx-auto px-5 sm:px-7 pb-6.5 flex justify-between items-center gap-4 flex-wrap border-b border-primary-hover">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => selectCategory(null)}
            className={`px-4.5 py-2.25 text-[12px] tracking-[.1em] border transition-colors ${
              category === null
                ? 'bg-secondary text-secondary-light border-secondary'
                : 'bg-transparent text-paragraph border-primary-hover hover:border-secondary'
            }`}
          >
            All stories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => selectCategory(c)}
              className={`px-4.5 py-2.25 text-[12px] tracking-[.1em] border transition-colors ${
                category === c
                  ? 'bg-secondary text-secondary-light border-secondary'
                  : 'bg-transparent text-paragraph border-primary-hover hover:border-secondary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="text-[12.5px] text-foreground font-light">{storyCount}</div>
      </div>

      <div className="max-w-310 mx-auto px-5 sm:px-7 pb-16">
        {loading ? (
          <div className="flex justify-center py-20"><Loader /></div>
        ) : blogs.length === 0 ? (
          <p className="text-center text-foreground py-20">No articles here yet — check back soon.</p>
        ) : (
          <>
            {/* Featured lead story */}
            <Link
              href={`/blog/${lead.slug}`}
              className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-8 md:gap-10 items-center bg-secondary-light p-6 md:p-7.5 mt-9"
            >
              <CardImage blog={lead} />
              <div>
                <div className="flex gap-3.5 items-center text-[10px] tracking-[.18em] text-accent">
                  {lead.category && <span>{lead.category}</span>}
                  <span className="text-[#AEA795] tracking-[.08em]">{formatDate(lead)}</span>
                </div>
                <h2 className="font-secondary text-2xl md:text-[32px] leading-[1.18] text-title mt-4">
                  {lead.title}
                </h2>
                {lead.excerpt && (
                  <p className="text-[14.5px] leading-[1.75] text-foreground font-light mt-3.5 max-w-[44ch]">
                    {lead.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-5.5">
                  <span className="text-[10.5px] tracking-[.18em] text-title border-b border-title pb-0.75">
                    READ THE POST
                  </span>
                  <span className="text-xs text-[#AEA795] font-light">{readLabel(lead)}</span>
                </div>
              </div>
            </Link>

            {/* Remaining stories grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6.5 mt-12">
                {rest.map((blog) => (
                  <Link
                    key={blog.id}
                    href={`/blog/${blog.slug}`}
                    className="border border-primary-hover bg-background flex flex-col hover:border-[#BDB29A] transition-colors"
                  >
                    <CardImage blog={blog} />
                    <div className="p-5.5 flex flex-col gap-2.5 flex-1">
                      <div className="flex justify-between gap-3 text-[10px] tracking-[.18em] text-accent">
                        {blog.category && <span>{blog.category}</span>}
                        <span className="text-[#AEA795] tracking-[.08em]">{formatDate(blog)}</span>
                      </div>
                      <div className="font-secondary text-lg leading-snug text-title line-clamp-2">
                        {blog.title}
                      </div>
                      {blog.excerpt && (
                        <p className="text-[13px] leading-[1.7] text-foreground font-light line-clamp-2">
                          {blog.excerpt}
                        </p>
                      )}
                      <div className="flex justify-between items-baseline gap-3 mt-auto pt-2.5">
                        <span className="text-[10.5px] tracking-[.18em] text-title">READ →</span>
                        <span className="text-[11.5px] text-[#AEA795] font-light">{readLabel(blog)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-14">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="border border-primary-hover px-5 py-2.5 text-[12px] tracking-[.1em] text-title hover:border-secondary transition-colors disabled:opacity-40 disabled:hover:border-primary-hover"
                >
                  ← PREV
                </button>
                <span className="text-[12.5px] text-foreground font-light">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="border border-primary-hover px-5 py-2.5 text-[12px] tracking-[.1em] text-title hover:border-secondary transition-colors disabled:opacity-40 disabled:hover:border-primary-hover"
                >
                  NEXT →
                </button>
              </div>
            )}
          </>
        )}

        {faqs.length > 0 && (
          <div className="border-t border-primary-hover mt-14 pt-10">
            <h2 className="font-secondary text-2xl text-title mb-5">Frequently asked questions</h2>
            <FaqAccordion faqs={faqs} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
