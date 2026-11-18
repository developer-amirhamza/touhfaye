import Link from "next/link";
import Breadcrumb from "../../components/UI/Breadcrumb";

export const metadata = {
  title: "Events & Corporate Gifting — Touhfaye",
  description:
    "Touhfaye plans and packs gifting for weddings, corporate milestones, Eid hampers and birthdays — sample designs, client feedback and a gallery from past events.",
};

const OFFERS = [
  {
    title: "Corporate gifting",
    desc: "Branded boxes for clients, staff and partners — your logo on the card or the box, one approved sample before the full run.",
  },
  {
    title: "Weddings & engagements",
    desc: "Matching jewellery and candle favours for the bridal party, wrapped in a shared theme and colour palette.",
  },
  {
    title: "Festive & Eid hampers",
    desc: "Bulk hampers for staff or family circles, ready for same-week dispatch during the festive rush.",
  },
  {
    title: "Birthdays & anniversaries",
    desc: "A single statement gift box or a small set for close family — built around what the occasion calls for.",
  },
];

const DESIGNS = [
  { src: "/touhfaye/rose-box-open-1.jpg", caption: "Preserved rose + pendant, wedding favour box" },
  { src: "/touhfaye/gift-set-flatlay.jpg", caption: "Branded hamper flatlay for a corporate order" },
  { src: "/touhfaye/name-puzzle-heart-duo.jpg", caption: "Matching pendant set, engagement gifting" },
  { src: "/touhfaye/projection-pendant-necklace.jpg", caption: "Rose-gold pendant in a branded gift box" },
];

const GALLERY = [
  "/touhfaye/rose-box-open-2.jpg",
  "/touhfaye/name-puzzle-heart-silver.jpg",
  "/touhfaye/gift-set-flatlay.jpg",
  "/touhfaye/projection-pendant-necklace.jpg",
  "/touhfaye/name-puzzle-heart-duo.jpg",
  "/touhfaye/rose-box-open-1.jpg",
];

const FEEDBACK = [
  {
    quote: "Forty identical boxes for our office Eid gifting, every one wrapped the same and delivered a day early. Made our HR team look very good.",
    name: "Rubaiya H.",
    role: "Corporate order, Dhanmondi",
  },
  {
    quote: "We used Touhfaye for all six bridesmaid gifts. They matched the ribbon colour to our wedding theme without being asked twice.",
    name: "Nafisa K.",
    role: "Wedding order, Sylhet",
  },
  {
    quote: "Sent a sample box before committing to 25 pieces for a client event — exactly what we needed to sign off with confidence.",
    name: "Imran T.",
    role: "Corporate order, Gulshan",
  },
];

const EventsPage = () => {
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
            Weddings, corporate milestones, Eid hampers and birthdays — we design, pack and deliver
            as one box or two hundred, wrapped the same way every time.
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

      {/* What we offer */}
      <section className="max-w-310 mx-auto px-5 sm:px-7 py-14">
        <h2 className="font-secondary text-3xl text-title mb-7">What we put together</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {OFFERS.map((o) => (
            <div key={o.title} className="border border-primary-hover p-6 bg-white">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-accent font-secondary text-lg mb-4">
                {o.title.charAt(0)}
              </div>
              <h3 className="font-secondary text-xl text-title mb-2">{o.title}</h3>
              <p className="text-sm text-foreground font-light leading-relaxed">{o.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Design showcase */}
      <section className="bg-secondary-light py-14">
        <div className="max-w-310 mx-auto px-5 sm:px-7">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-7">
            <div>
              <div className="text-[11px] tracking-[.2em] text-accent mb-2">DESIGN</div>
              <h2 className="font-secondary text-3xl text-title">Packaging built around your event</h2>
            </div>
            <p className="text-sm text-foreground font-light max-w-sm">
              Ribbon colour, card wording and box finish are all adjustable — tell us the theme and
              we&apos;ll send a mock-up before anything is made.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DESIGNS.map((d) => (
              <div key={d.src} className="bg-white shadow-[0_1px_2px_rgba(18,40,28,0.06),0_8px_24px_rgba(18,40,28,0.08)]">
                <div className="relative bg-primary overflow-hidden" style={{ aspectRatio: "4/5" }}>
                  <img src={d.src} alt={d.caption} className="w-full h-full object-cover" />
                </div>
                <p className="text-[13px] text-foreground font-light p-3.5">{d.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feedback */}
      <section className="max-w-310 mx-auto px-5 sm:px-7 py-14">
        <h2 className="font-secondary text-3xl text-title mb-7">What event clients say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEEDBACK.map((f) => (
            <div key={f.name} className="border border-primary-hover bg-white p-6 flex flex-col h-full">
              <p className="text-[14.5px] text-paragraph font-light leading-relaxed flex-1">
                &ldquo;{f.quote}&rdquo;
              </p>
              <div className="mt-5 pt-4 border-t border-primary-hover">
                <div className="text-sm text-title">{f.name}</div>
                <div className="text-[12px] text-accent font-light mt-0.5">{f.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="bg-secondary-light py-14">
        <div className="max-w-310 mx-auto px-5 sm:px-7">
          <div className="text-[11px] tracking-[.2em] text-accent mb-2">GALLERY</div>
          <h2 className="font-secondary text-3xl text-title mb-7">From past events</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
            {GALLERY.map((src, i) => (
              <div
                key={src + i}
                className="relative bg-primary overflow-hidden"
                style={{ aspectRatio: i % 3 === 0 ? "4/5" : "1/1" }}
              >
                <img src={src} alt="Touhfaye event gifting" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-310 mx-auto px-5 sm:px-7 py-14">
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
