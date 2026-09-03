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

const meta = (blog: Blog) => {
  const date = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  return [`${blog.readTime ?? 5} min read`, date].filter(Boolean).join(' · ');
};

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

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />
      </div>

      <div className="container mx-auto px-6 pb-6 text-center">
        <span className="bg-[#d8e8dc] text-secondary font-semibold rounded-full px-4.5 py-2 text-sm">
          Blog &amp; Care Guides
        </span>
        <h1 className="font-secondary text-4xl md:text-5xl text-text-hover tracking-tight mt-4">
          Incontinence care guides and advice
        </h1>
        <p className="text-base md:text-lg text-text max-w-xl mx-auto mt-2">
          Honest, evidence-based articles to support you and the people you care for.
        </p>
      </div>

      <div className="container mx-auto px-6 pb-14">
        <div className="flex gap-2.5 flex-wrap justify-center mb-10">
          <button
            onClick={() => selectCategory(null)}
            className={`font-semibold rounded-full px-5 py-2 text-sm border transition-colors ${
              category === null
                ? 'bg-secondary text-background border-secondary'
                : 'bg-white text-text-hover border-primary-hover hover:border-secondary'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => selectCategory(c)}
              className={`font-semibold rounded-full px-5 py-2 text-sm border transition-colors ${
                category === c
                  ? 'bg-secondary text-background border-secondary'
                  : 'bg-white text-text-hover border-primary-hover hover:border-secondary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader /></div>
        ) : blogs.length === 0 ? (
          <p className="text-center text-text py-20">No articles here yet — check back soon.</p>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <Link
                  key={blog.id}
                  href={`/blog/${blog.slug}`}
                  className="bg-white border border-primary-hover rounded-2xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 bg-[#d8e8dc]">
                    {blog.featuredImage ? (
                      <img src={blog.featuredImage} alt={blog.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-secondary/30 text-4xl font-secondary">
                        {blog.title[0]}
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col gap-2 flex-1">
                    {blog.category && (
                      <span className="text-secondary font-semibold text-sm">{blog.category}</span>
                    )}
                    <h2 className="font-secondary text-2xl leading-tight line-clamp-2">{blog.title}</h2>
                    {blog.excerpt && <p className="text-text leading-relaxed line-clamp-2 flex-1">{blog.excerpt}</p>}
                    <span className="text-sm text-text mt-1">
                      {meta(blog)} · <span className="text-secondary font-semibold">Read →</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-12">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-full border border-primary-hover px-5 py-2.5 font-semibold text-sm text-text-hover hover:border-secondary transition-colors disabled:opacity-40 disabled:hover:border-primary-hover"
                >
                  ← Prev
                </button>
                <span className="text-sm text-text">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-full border border-primary-hover px-5 py-2.5 font-semibold text-sm text-text-hover hover:border-secondary transition-colors disabled:opacity-40 disabled:hover:border-primary-hover"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {faqs.length > 0 && (
          <div className="border-t border-primary-hover mt-14 pt-10">
            <h2 className="font-secondary text-2xl text-text-hover mb-5">Frequently asked questions</h2>
            <FaqAccordion faqs={faqs} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
