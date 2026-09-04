"use client";
import { useState } from "react";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
}

// Renders an accordion for a list of Q&As and emits matching FAQPage
// structured data alongside it, so any surface showing FAQ content (the
// standalone FAQ page, or an article's embedded FAQ section) gets rich
// results for free.
export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (faqs.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="flex flex-col gap-3">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqs.map((faq) => {
        const open = openId === faq.id;
        return (
          <div key={faq.id} className="border border-primary-hover rounded-xl overflow-hidden bg-background">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : faq.id)}
              aria-expanded={open}
              className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-medium text-text-hover"
            >
              {faq.question}
              <span className={`shrink-0 text-secondary transition-transform ${open ? "rotate-45" : ""}`}>+</span>
            </button>
            {open && (
              <div className="px-5 pb-4 text-sm text-text leading-relaxed">{faq.answer}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
