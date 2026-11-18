"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import Loader from '@/app/(main)/components/UI/Loader';
import { SITE_URL } from '@/utils/siteConfig';
import touhfayeLogo from '@/assets/touhfaye-logo.png';

interface FeedbackEntry {
  name: string;
  role?: string;
  quote: string;
}

interface EventDetail {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  description: string;
  category?: string;
  location?: string;
  eventDate?: string;
  coverImage?: string;
  designImages?: string[];
  galleryImages?: string[];
  feedback?: FeedbackEntry[];
  publishedAt: string;
  updatedAt: string;
  views: number;
}

const EventDetailPage = () => {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<EventDetail>();
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<EventDetail[]>([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await Axios({ ...SummeryApi.getEventBySlug, data: { slug } });
        if (response.data?.success) setEvent(response.data.data);
      } catch (error) {
        AxiosToastError(error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchEvent();
  }, [slug]);

  useEffect(() => {
    if (!event?.id) return;
    Axios({ ...SummeryApi.getAllEvents, params: { page: 1, limit: 8 } })
      .then((res) => {
        if (res.data?.success) {
          const others = (res.data.data as EventDetail[]).filter((e) => e.id !== event.id);
          setRelated(others.slice(0, 4));
        }
      })
      .catch(() => {});
  }, [event?.id]);

  if (loading) return <div className="flex justify-center py-20"><Loader /></div>;
  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-text-hover text-lg mb-4">Event not found.</p>
        <Link href="/events" className="text-secondary font-semibold">← Back to Events</Link>
      </div>
    );
  }

  const date = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const nextEvent = related[0];
  const moreEvents = related.slice(1, 4);
  const feedback = (event.feedback || []).filter((f) => f.quote);
  const designImages = event.designImages || [];
  const galleryImages = event.galleryImages || [];

  const shareUrl = `${SITE_URL}/events/${event.slug}`;
  const shareOnFacebook = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.success('Link copied'))
      .catch(() => toast.error('Could not copy link'));
  };

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.excerpt || event.title,
    ...(event.eventDate ? { startDate: event.eventDate } : {}),
    ...(event.location ? { location: { "@type": "Place", name: event.location } } : {}),
    organizer: {
      "@type": "Organization",
      name: "Touhfaye",
      logo: { "@type": "ImageObject", url: `${SITE_URL}${touhfayeLogo.src}` },
    },
    ...(event.coverImage ? { image: event.coverImage } : {}),
    mainEntityOfPage: `${SITE_URL}/events/${event.slug}`,
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="max-w-310 mx-auto px-5 sm:px-7 pt-7.5 text-[10.5px] tracking-[.26em] text-accent">
        <Link href="/events" className="hover:text-title transition-colors">EVENTS</Link>
        {event.category && <> / {event.category}</>}
      </div>

      {/* Header */}
      <section className="max-w-[760px] mx-auto px-5 sm:px-7 pt-8.5 text-center">
        <div className="flex gap-3.5 justify-center items-center text-[10px] tracking-[.18em] text-accent flex-wrap">
          {event.category && <span>{event.category}</span>}
          {event.category && (event.location || date) && <span className="text-[#DCCFB6]">·</span>}
          {event.location && <span className="text-[#AEA795] tracking-[.08em]">{event.location}</span>}
          {event.location && date && <span className="text-[#DCCFB6]">·</span>}
          {date && <span className="text-[#AEA795] tracking-[.08em]">{date}</span>}
        </div>
        <h1 className="font-secondary text-3xl sm:text-4xl md:text-[44px] leading-[1.14] text-title mt-5">
          {event.title}
        </h1>
        {event.excerpt && (
          <p className="font-serif italic font-medium text-[21px] leading-[1.55] text-foreground mt-4.5 max-w-[34ch] mx-auto">
            {event.excerpt}
          </p>
        )}
      </section>

      {/* Cover image */}
      {event.coverImage && (
        <section className="max-w-[1000px] mx-auto px-5 sm:px-7 pt-9">
          <div className="relative bg-primary overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
          </div>
        </section>
      )}

      {/* Body */}
      <section className="max-w-[700px] mx-auto px-5 sm:px-7 pt-10">
        <div
          className="text-[#3F3A30] font-light text-[16.5px] leading-[1.85] [&>*+*]:mt-5.5 [&_a]:text-title [&_a]:no-underline [&_a:hover]:underline [&_h2]:font-secondary [&_h2]:text-title [&_h2]:text-2xl [&_h2]:font-normal [&_h3]:font-secondary [&_h3]:text-title [&_h3]:text-xl [&_h3]:font-normal"
          dangerouslySetInnerHTML={{ __html: event.description }}
        />

        <div className="border-t border-primary-hover mt-7 pt-5.5 flex justify-between items-center gap-4.5 flex-wrap">
          <Link href="/events" className="text-[11px] tracking-[.16em] text-foreground border-b border-[#BDB29A] pb-0.75">
            ← ALL EVENTS
          </Link>
          <div className="flex gap-4 text-[11px] tracking-[.16em] text-accent">
            <span>SHARE</span>
            <button onClick={shareOnFacebook} className="hover:text-title transition-colors cursor-pointer">FACEBOOK</button>
            <button onClick={copyLink} className="hover:text-title transition-colors cursor-pointer">COPY LINK</button>
          </div>
        </div>
      </section>

      {/* Design showcase */}
      {designImages.length > 0 && (
        <section className="bg-secondary-light py-14 mt-14">
          <div className="max-w-310 mx-auto px-5 sm:px-7">
            <div className="text-[11px] tracking-[.2em] text-accent mb-2">DESIGN</div>
            <h2 className="font-secondary text-3xl text-title mb-7">How it was packaged</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {designImages.map((src, i) => (
                <div key={src + i} className="bg-white shadow-[0_1px_2px_rgba(18,40,28,0.06),0_8px_24px_rgba(18,40,28,0.08)]">
                  <div className="relative bg-primary overflow-hidden" style={{ aspectRatio: '4/5' }}>
                    <img src={src} alt={`${event.title} design ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feedback */}
      {feedback.length > 0 && (
        <section className="max-w-310 mx-auto px-5 sm:px-7 py-14">
          <h2 className="font-secondary text-3xl text-title mb-7">What they said</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {feedback.map((f, i) => (
              <div key={f.name + i} className="border border-primary-hover bg-white p-6 flex flex-col h-full">
                <p className="text-[14.5px] text-paragraph font-light leading-relaxed flex-1">
                  &ldquo;{f.quote}&rdquo;
                </p>
                <div className="mt-5 pt-4 border-t border-primary-hover">
                  {f.name && <div className="text-sm text-title">{f.name}</div>}
                  {f.role && <div className="text-[12px] text-accent font-light mt-0.5">{f.role}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section className="bg-secondary-light py-14">
          <div className="max-w-310 mx-auto px-5 sm:px-7">
            <div className="text-[11px] tracking-[.2em] text-accent mb-2">GALLERY</div>
            <h2 className="font-secondary text-3xl text-title mb-7">Photos from the day</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
              {galleryImages.map((src, i) => (
                <div
                  key={src + i}
                  className="relative bg-primary overflow-hidden"
                  style={{ aspectRatio: i % 3 === 0 ? '4/5' : '1/1' }}
                >
                  <img src={src} alt={`${event.title} photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Next event */}
      {nextEvent && (
        <section className="max-w-[1000px] mx-auto px-5 sm:px-7 pt-14">
          <Link
            href={`/events/${nextEvent.slug}`}
            className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-7 items-center bg-secondary text-secondary-light p-7.5"
          >
            <div className="relative bg-secondary-hover overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {nextEvent.coverImage && (
                <img src={nextEvent.coverImage} alt={nextEvent.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <div className="text-[10px] tracking-[.2em] text-[#9FA890]">NEXT EVENT</div>
              <div className="font-secondary text-2xl leading-[1.25] text-[#F3E9D2] mt-3">{nextEvent.title}</div>
              {nextEvent.excerpt && (
                <div className="text-[13px] leading-[1.7] text-[#9FA890] font-light mt-2.5 max-w-[46ch]">
                  {nextEvent.excerpt}
                </div>
              )}
              <span className="inline-block text-[10.5px] tracking-[.18em] text-accent-light mt-4">VIEW →</span>
            </div>
          </Link>
        </section>
      )}

      {/* More events */}
      {moreEvents.length > 0 && (
        <section className="max-w-310 mx-auto px-5 sm:px-7 pt-16">
          <h2 className="font-secondary text-2xl text-title mb-6">More events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6.5">
            {moreEvents.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.slug}`}
                className="border border-primary-hover bg-background flex flex-col hover:border-[#BDB29A] transition-colors"
              >
                <div className="relative bg-primary overflow-hidden" style={{ aspectRatio: '16/10' }}>
                  {e.coverImage && <img src={e.coverImage} alt={e.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-5 flex flex-col gap-2 flex-1">
                  {e.category && <div className="text-[10px] tracking-[.18em] text-accent">{e.category}</div>}
                  <div className="font-secondary text-lg leading-snug text-title">{e.title}</div>
                  <span className="text-[10.5px] tracking-[.18em] text-title mt-auto pt-2">VIEW →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-310 mx-auto px-5 sm:px-7 pt-16">
        <div className="bg-secondary text-secondary-light p-9 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="font-secondary text-2xl md:text-3xl text-background mb-2">
              Planning something similar?
            </h2>
            <p className="text-secondary-light/80 font-light max-w-md">
              Tell us the occasion, the headcount and the date — we&apos;ll send a sample before the full run.
            </p>
          </div>
          <Link
            href="/contact-us"
            className="inline-block text-center bg-accent-light text-secondary hover:bg-accent px-7 py-3.5 text-[11.5px] tracking-[.18em] transition-colors shrink-0"
          >
            MESSAGE US
          </Link>
        </div>
      </section>
    </div>
  );
};

export default EventDetailPage;
