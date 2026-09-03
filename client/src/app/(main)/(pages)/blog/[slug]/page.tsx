"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import Loader from '@/app/(main)/components/UI/Loader';
import Breadcrumb from '@/app/(main)/components/UI/Breadcrumb';
import FaqAccordion, { FaqItem } from '@/app/(main)/components/UI/FaqAccordion';
import { SITE_URL } from '@/utils/siteConfig';
import bestieeLogo from '@/assets/bestiee-logo.png';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  category?: string;
  tags?: string[];
  publishedAt: string;
  updatedAt: string;
  readTime?: number;
  views: number;
}

const BlogDetailPage = () => {
  const params = useParams();
  const slug = params.slug as string;
  const [blog, setBlog] = useState<Blog>();
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await Axios({ ...SummeryApi.getBlogBySlug, data: { slug } });
        if (response.data?.success) setBlog(response.data.data);
      } catch (error) {
        AxiosToastError(error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchBlog();
  }, [slug]);

  useEffect(() => {
    if (!blog?.id) return;
    Axios({ ...SummeryApi.getFaqs, params: { surface: "BLOG_POST", blogId: blog.id } })
      .then((res) => {
        if (res.data?.success) setFaqs(res.data.data);
      })
      .catch(() => { /* embedded FAQs are optional — fail silently */ });
  }, [blog?.id]);

  if (loading) return <div className="flex justify-center py-20"><Loader /></div>;
  if (!blog) {
    return (
      <div className="text-center py-20">
        <p className="text-text-hover text-lg mb-4">Article not found.</p>
        <Link href="/blog" className="text-secondary font-semibold">← Back to Blog</Link>
      </div>
    );
  }

  const date = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    author: { "@type": "Organization", name: "Bestiee" },
    publisher: {
      "@type": "Organization",
      name: "Bestiee",
      logo: { "@type": "ImageObject", url: `${SITE_URL}${bestieeLogo.src}` },
    },
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt || blog.publishedAt,
    ...(blog.featuredImage ? { image: blog.featuredImage } : {}),
    mainEntityOfPage: `${SITE_URL}/blog/${blog.slug}`,
  };

  return (
    <div className="bg-background min-h-screen py-8">
      <article className="container mx-auto px-6 max-w-3xl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            ...(blog.category ? [{ label: blog.category, href: `/blog?category=${encodeURIComponent(blog.category)}` }] : []),
            { label: blog.title },
          ]}
        />

        <div className="mt-6">
          {blog.category && (
            <span className="bg-[#d8e8dc] text-secondary font-semibold rounded-full px-4.5 py-2 text-sm">
              {blog.category}
            </span>
          )}
          <h1 className="font-secondary text-3xl md:text-5xl leading-tight text-text-hover mt-4 mb-3">{blog.title}</h1>
          <div className="flex items-center gap-3 text-sm text-text">
            <span>{date}</span>
            <span>·</span>
            <span>{blog.readTime ?? 5} min read</span>
            <span>·</span>
            <span>{blog.views} views</span>
          </div>
        </div>

        {blog.featuredImage && (
          <img
            src={blog.featuredImage}
            alt={blog.title}
            className="w-full h-72 md:h-96 object-cover rounded-2xl mt-8 mb-8"
          />
        )}

        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {blog.tags.map((tag) => (
              <span key={tag} className="bg-primary text-text-hover text-sm font-medium rounded-full px-3.5 py-1.5">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="prose max-w-none text-text leading-relaxed [&_a]:text-secondary [&_a]:font-semibold [&_a]:no-underline [&_a:hover]:underline [&_h2]:font-secondary [&_h2]:text-text-hover [&_h3]:font-secondary [&_h3]:text-text-hover"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {faqs.length > 0 && (
          <div className="border-t border-primary-hover mt-12 pt-8">
            <h2 className="font-secondary text-2xl text-text-hover mb-5">Frequently asked questions</h2>
            <FaqAccordion faqs={faqs} />
          </div>
        )}

        <div className="border-t border-primary-hover mt-12 pt-8">
          <Link href="/blog" className="text-secondary font-semibold">← Back to Blog</Link>
        </div>
      </article>
    </div>
  );
};

export default BlogDetailPage;
