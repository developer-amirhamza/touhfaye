"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import Loader from '@/app/(main)/components/UI/Loader';
import FaqAccordion, { FaqItem } from '@/app/(main)/components/UI/FaqAccordion';
import { SITE_URL } from '@/utils/siteConfig';
import touhfayeLogo from '@/assets/touhfaye-logo.png';

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
  const [related, setRelated] = useState<Blog[]>([]);

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

  // "Next story" + "More stories" are pulled from the latest posts rather
  // than a dedicated relation — same approach the mock's static data uses.
  useEffect(() => {
    if (!blog?.id) return;
    Axios({ ...SummeryApi.getAllBlogs, params: { page: 1, limit: 8 } })
      .then((res) => {
        if (res.data?.success) {
          const others = (res.data.data as Blog[]).filter((b) => b.id !== blog.id);
          setRelated(others.slice(0, 4));
        }
      })
      .catch(() => {});
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
  const readLabel = `${blog.readTime ?? 5} min read`;
  const nextPost = related[0];
  const morePosts = related.slice(1, 4);

  const shareUrl = `${SITE_URL}/blog/${blog.slug}`;
  const shareOnFacebook = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.success('Link copied'))
      .catch(() => toast.error('Could not copy link'));
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    author: { "@type": "Organization", name: "Touhfaye" },
    publisher: {
      "@type": "Organization",
      name: "Touhfaye",
      logo: { "@type": "ImageObject", url: `${SITE_URL}${touhfayeLogo.src}` },
    },
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt || blog.publishedAt,
    ...(blog.featuredImage ? { image: blog.featuredImage } : {}),
    mainEntityOfPage: `${SITE_URL}/blog/${blog.slug}`,
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="max-w-310 mx-auto px-5 sm:px-7 pt-7.5 text-[10.5px] tracking-[.26em] text-accent">
        <Link href="/blog" className="hover:text-title transition-colors">STORIES</Link>
        {blog.category && <> / {blog.category}</>}
      </div>

      {/* Header */}
      <section className="max-w-[760px] mx-auto px-5 sm:px-7 pt-8.5 text-center">
        <div className="flex gap-3.5 justify-center items-center text-[10px] tracking-[.18em] text-accent flex-wrap">
          {blog.category && <span>{blog.category}</span>}
          {blog.category && <span className="text-[#DCCFB6]">·</span>}
          <span className="text-[#AEA795] tracking-[.08em]">{date}</span>
          <span className="text-[#DCCFB6]">·</span>
          <span className="text-[#AEA795] tracking-[.08em]">{readLabel}</span>
        </div>
        <h1 className="font-secondary text-3xl sm:text-4xl md:text-[44px] leading-[1.14] text-title mt-5">
          {blog.title}
        </h1>
        {blog.excerpt && (
          <p className="font-serif italic font-medium text-[21px] leading-[1.55] text-foreground mt-4.5 max-w-[34ch] mx-auto">
            {blog.excerpt}
          </p>
        )}
      </section>

      {/* Featured image */}
      {blog.featuredImage && (
        <section className="max-w-[1000px] mx-auto px-5 sm:px-7 pt-9">
          <div className="relative bg-primary overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <img src={blog.featuredImage} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        </section>
      )}

      {/* Body */}
      <section className="max-w-[700px] mx-auto px-5 sm:px-7 pt-10">
        <div
          className="text-[#3F3A30] font-light text-[16.5px] leading-[1.85] [&>*+*]:mt-5.5 [&_a]:text-title [&_a]:no-underline [&_a:hover]:underline [&_h2]:font-secondary [&_h2]:text-title [&_h2]:text-2xl [&_h2]:font-normal [&_h3]:font-secondary [&_h3]:text-title [&_h3]:text-xl [&_h3]:font-normal"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-7">
            {blog.tags.map((tag) => (
              <span key={tag} className="text-[11px] tracking-[.08em] text-accent border border-primary-hover px-3 py-1.5">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {faqs.length > 0 && (
          <div className="border-t border-primary-hover mt-10 pt-8">
            <h2 className="font-secondary text-2xl text-title mb-5">Frequently asked questions</h2>
            <FaqAccordion faqs={faqs} />
          </div>
        )}

        <div className="border-t border-primary-hover mt-7 pt-5.5 flex justify-between items-center gap-4.5 flex-wrap">
          <Link href="/blog" className="text-[11px] tracking-[.16em] text-foreground border-b border-[#BDB29A] pb-0.75">
            ← ALL STORIES
          </Link>
          <div className="flex gap-4 text-[11px] tracking-[.16em] text-accent">
            <span>SHARE</span>
            <button onClick={shareOnFacebook} className="hover:text-title transition-colors cursor-pointer">FACEBOOK</button>
            <button onClick={copyLink} className="hover:text-title transition-colors cursor-pointer">COPY LINK</button>
          </div>
        </div>
      </section>

      {/* Next story */}
      {nextPost && (
        <section className="max-w-[1000px] mx-auto px-5 sm:px-7 pt-11">
          <Link
            href={`/blog/${nextPost.slug}`}
            className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-7 items-center bg-secondary text-secondary-light p-7.5"
          >
            <div className="relative bg-secondary-hover overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {nextPost.featuredImage && (
                <img src={nextPost.featuredImage} alt={nextPost.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <div className="text-[10px] tracking-[.2em] text-[#9FA890]">NEXT STORY</div>
              <div className="font-secondary text-2xl leading-[1.25] text-[#F3E9D2] mt-3">{nextPost.title}</div>
              {nextPost.excerpt && (
                <div className="text-[13px] leading-[1.7] text-[#9FA890] font-light mt-2.5 max-w-[46ch]">
                  {nextPost.excerpt}
                </div>
              )}
              <span className="inline-block text-[10.5px] tracking-[.18em] text-accent-light mt-4">READ →</span>
            </div>
          </Link>
        </section>
      )}

      {/* More stories */}
      {morePosts.length > 0 && (
        <section className="max-w-310 mx-auto px-5 sm:px-7 pt-16">
          <h2 className="font-secondary text-2xl text-title mb-6">More stories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6.5">
            {morePosts.map((b) => (
              <Link
                key={b.id}
                href={`/blog/${b.slug}`}
                className="border border-primary-hover bg-background flex flex-col hover:border-[#BDB29A] transition-colors"
              >
                <div className="relative bg-primary overflow-hidden" style={{ aspectRatio: '16/10' }}>
                  {b.featuredImage && <img src={b.featuredImage} alt={b.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-5 flex flex-col gap-2 flex-1">
                  {b.category && <div className="text-[10px] tracking-[.18em] text-accent">{b.category}</div>}
                  <div className="font-secondary text-lg leading-snug text-title">{b.title}</div>
                  <span className="text-[10.5px] tracking-[.18em] text-title mt-auto pt-2">READ →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default BlogDetailPage;
