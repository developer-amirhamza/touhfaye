"use client";
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import Loader from '../../components/UI/Loader';
import Breadcrumb from '../../components/UI/Breadcrumb';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  location: string;
  eventDate: string;
  coverImage: string;
  views: number;
}

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

const EventsPage = () => {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader /></div>}>
      <EventsPageContent />
    </Suspense>
  );
};

const EventsPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(searchParams.get('category'));
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    Axios({ ...SummeryApi.getAllEvents, params: { page: 1, limit: 100 } })
      .then((res) => {
        if (res.data?.success) {
          const distinct = Array.from(new Set(res.data.data.map((e: EventItem) => e.category).filter(Boolean))) as string[];
          setCategories(distinct);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Axios({ ...SummeryApi.getAllEvents, params: { page, limit: 9, ...(category ? { category } : {}) } })
      .then((res) => {
        if (res.data?.success) {
          setEvents(res.data.data);
          setTotalPages(res.data.pagination.totalPages || 1);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, category]);

  const selectCategory = (c: string | null) => {
    setCategory(c);
    setPage(1);
    router.replace(c ? `/events?category=${encodeURIComponent(c)}` : '/events');
  };

  const lead = events[0];
  const rest = events.slice(1);
  const eventCount = events.length + (events.length === 1 ? ' event' : ' events');

  const CardImage = ({ event }: { event: EventItem }) => (
    <div className="relative bg-primary overflow-hidden" style={{ aspectRatio: '4/5' }}>
      {event.coverImage ? (
        <img src={event.coverImage} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-title/20 text-4xl font-secondary">
          {event.title[0]}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className="bg-secondary-light">
        <div className="max-w-310 mx-auto px-5 sm:px-7 pt-10 pb-9">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Events" }]} />
          <h1 className="font-secondary text-4xl md:text-5xl leading-tight text-title mt-3 mb-2">
            Gifting for your events
          </h1>
          <p className="text-lg text-paragraph font-light leading-relaxed max-w-2xl">
            Weddings, corporate milestones, Eid hampers and birthdays — browse what we&apos;ve put
            together before, with the design, feedback and photos from each one.
          </p>
          <div className="flex gap-2.5 mt-5 flex-wrap">
            {["Sample before full run", "Logo on card or box", "20+ pieces · 7–10 day lead time"].map((t) => (
              <span key={t} className="bg-background text-accent rounded-full px-4 py-2 text-sm font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Category tabs + count */}
      <div className="max-w-310 mx-auto px-5 sm:px-7 py-6.5 flex justify-between items-center gap-4 flex-wrap border-b border-primary-hover">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => selectCategory(null)}
            className={`px-4.5 py-2.25 text-[12px] tracking-[.1em] border transition-colors ${
              category === null
                ? 'bg-secondary text-secondary-light border-secondary'
                : 'bg-transparent text-paragraph border-primary-hover hover:border-secondary'
            }`}
          >
            All events
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
        {!loading && <div className="text-[12.5px] text-foreground font-light">{eventCount}</div>}
      </div>

      <div className="max-w-310 mx-auto px-5 sm:px-7 pb-16">
        {loading ? (
          <div className="flex justify-center py-20"><Loader /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-foreground mb-6">No events posted yet — check back soon.</p>
            <Link
              href="/contact-us"
              className="inline-block text-center bg-accent-light text-secondary hover:bg-accent px-7 py-3.5 text-[11.5px] tracking-[.18em] transition-colors"
            >
              PLAN AN EVENT WITH US
            </Link>
          </div>
        ) : (
          <>
            {/* Featured lead event */}
            <Link
              href={`/events/${lead.slug}`}
              className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-8 md:gap-10 items-center bg-secondary-light p-6 md:p-7.5 mt-2"
            >
              <CardImage event={lead} />
              <div>
                <div className="flex gap-3.5 items-center text-[10px] tracking-[.18em] text-accent flex-wrap">
                  {lead.category && <span>{lead.category}</span>}
                  {lead.location && <span className="text-[#AEA795] tracking-[.08em]">{lead.location}</span>}
                  {lead.eventDate && <span className="text-[#AEA795] tracking-[.08em]">{formatDate(lead.eventDate)}</span>}
                </div>
                <h2 className="font-secondary text-2xl md:text-[32px] leading-[1.18] text-title mt-4">
                  {lead.title}
                </h2>
                {lead.excerpt && (
                  <p className="text-[14.5px] leading-[1.75] text-foreground font-light mt-3.5 max-w-[44ch]">
                    {lead.excerpt}
                  </p>
                )}
                <span className="inline-block text-[10.5px] tracking-[.18em] text-title border-b border-title pb-0.75 mt-5.5">
                  VIEW THE EVENT
                </span>
              </div>
            </Link>

            {/* Remaining events grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6.5 mt-12">
                {rest.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="border border-primary-hover bg-background flex flex-col hover:border-[#BDB29A] transition-colors"
                  >
                    <CardImage event={event} />
                    <div className="p-5.5 flex flex-col gap-2.5 flex-1">
                      <div className="flex justify-between gap-3 text-[10px] tracking-[.18em] text-accent flex-wrap">
                        {event.category && <span>{event.category}</span>}
                        {event.eventDate && <span className="text-[#AEA795] tracking-[.08em]">{formatDate(event.eventDate)}</span>}
                      </div>
                      <div className="font-secondary text-lg leading-snug text-title line-clamp-2">
                        {event.title}
                      </div>
                      {event.excerpt && (
                        <p className="text-[13px] leading-[1.7] text-foreground font-light line-clamp-2">
                          {event.excerpt}
                        </p>
                      )}
                      <div className="flex justify-between items-baseline gap-3 mt-auto pt-2.5">
                        <span className="text-[10.5px] tracking-[.18em] text-title">VIEW →</span>
                        {event.location && <span className="text-[11.5px] text-[#AEA795] font-light">{event.location}</span>}
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
      </div>

      {/* CTA */}
      <section className="max-w-310 mx-auto px-5 sm:px-7 pb-16">
        <div className="bg-secondary text-secondary-light p-9 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="font-secondary text-2xl md:text-3xl text-background mb-2">
              Planning gifting for an event?
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

export default EventsPage;
