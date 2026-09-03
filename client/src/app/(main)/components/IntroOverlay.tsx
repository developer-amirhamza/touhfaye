"use client";
import { useEffect, useRef, useState } from "react";

// Brand splash intro: the "B" badge scales/fades in on the brand-green
// backdrop, the "Bestiee" wordmark and tagline follow, a sliding loading
// bar plays throughout, then the curtain lifts. Mounts the instant the
// component renders (no waiting on window "load"), so it always covers the
// site before any content is visible.
//
// Reliability first: if GSAP fails to load (or reduced-motion is set), the
// same content just fades in on plain CSS and the intro still reveals on
// schedule.
//
// Shown once per browser, ever — not once per tab/session — so a returning
// visitor never sees it again after their first visit. The storage key was
// bumped for this redesign so everyone sees the new splash once.
const INTRO_SEEN_KEY = "bestiee_intro_seen_v2";
const CONTENT_AT_MS = 100;   // badge starts fading in almost immediately
const CONTENT_HOLD_MS = 1500; // how long the splash sits before the curtain lifts
const REVEAL_MS = 650;       // curtain-lift slide-up duration
const GSAP_TIMEOUT_MS = 2500; // give up on GSAP after this → reveal via CSS fallback
const REDUCED_HOLD_MS = 1000;

export default function IntroOverlay() {
  // Defaults to visible so the cover is part of the very first paint (SSR
  // HTML included) — nothing behind it, not even a blank flash, can show
  // before we've had a chance to decide whether to keep it up.
  const [show, setShow] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [gsapOn, setGsapOn] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<any>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const done = useRef(false);
  // Avoids a stale-closure read of `gsapOn` state inside the bail timeout.
  const gsapOnRef = useRef(false);

  useEffect(() => {
    // Dev: show on every load. Production: once per browser, ever.
    // const isDev = process.env.NODE_ENV == "production";
    // if (!isDev) {
      let seen = false;
      try {
        seen = localStorage.getItem(INTRO_SEEN_KEY) === "1";
      } catch {
        seen = true;
      }
      if (seen) {
        // Already played on a previous visit — drop the cover immediately,
        // no animation, no re-blocking scroll.
        done.current = true;
        setShow(false);
        return;
      }
    // }

    // if (!isDev) {
      try {
        localStorage.setItem(INTRO_SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
    // }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      // Badge + text fade only, no bounce — hold briefly then reveal.
      timers.current.push(setTimeout(() => triggerReveal(), REDUCED_HOLD_MS));
    } else {
      // Bail out to a plain CSS fade if GSAP never loads in time.
      const bail = setTimeout(() => {
        if (!gsapOnRef.current) triggerReveal();
      }, GSAP_TIMEOUT_MS);

      (async () => {
        try {
          const gsap = (await import("gsap")).default;
          if (done.current) return;
          const root = rootRef.current;
          if (!root) return;

          clearTimeout(bail);
          gsapOnRef.current = true;
          setGsapOn(true);

          const tl = gsap.timeline({ defaults: { ease: "none" } });
          const q = (sel: string) => root.querySelectorAll(sel);
          const contentAt = CONTENT_AT_MS / 1000;

          // Badge scales/fades in with a slight overshoot.
          tl.fromTo(
            q(".intro-badge"),
            { opacity: 0, scale: 0.82, y: 6 },
            { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.7)" },
            contentAt
          );
          // Loading bar fades in right behind the badge.
          tl.fromTo(
            q(".intro-loadbar"),
            { opacity: 0 },
            { opacity: 1, duration: 0.3 },
            contentAt + 0.1
          );
          // Wordmark, then tagline.
          tl.fromTo(
            q(".intro-wordmark"),
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
            contentAt + 0.4
          );
          tl.fromTo(
            q(".intro-tagline"),
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: "power2.out" },
            contentAt + 0.55
          );

          tl.call(() => triggerReveal(), undefined, contentAt + 0.55 + 0.3 + CONTENT_HOLD_MS / 1000);

          tlRef.current = tl;
        } catch {
          clearTimeout(bail);
          if (!done.current) triggerReveal();
        }
      })();
    }

    return () => {
      done.current = true;
      document.body.style.overflow = prevOverflow;
      timers.current.forEach(clearTimeout);
      try {
        tlRef.current?.kill?.();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerReveal = () => {
    if (done.current) return;
    setRevealing(true);
    timers.current.push(
      setTimeout(() => {
        done.current = true;
        document.body.style.overflow = "";
        setShow(false);
      }, REVEAL_MS)
    );
  };

  if (!show) return null;

  return (
    <div ref={rootRef} aria-hidden="true">
      <style>{introStyles}</style>
      <div
        className={`intro-panel ${gsapOn ? "" : "intro-css-fallback"} ${revealing ? "intro-reveal" : ""}`}
        onClick={triggerReveal}
      >
        <div className="intro-content">
          <div className="intro-badge">
            <img src="/favicon.png" alt="Bestiee" />
          </div>
          <span className="intro-wordmark">Bestiee</span>
          <span className="intro-tagline">Comfort, delivered discreetly</span>
        </div>

        <div className="intro-loadbar">
          <span className="intro-loadbar-fill" />
        </div>

        <button
          type="button"
          className="intro-skip"
          aria-label="Skip intro animation"
          onClick={(e) => {
            e.stopPropagation();
            triggerReveal();
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

const introStyles = `
.intro-panel{
  position:fixed; inset:0; z-index:9999; overflow:hidden;
  background:var(--secondary-hover, #1f8049);
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; will-change:transform; transform:translateY(0);
}
.intro-panel.intro-reveal{
  transform:translateY(-100%);
  transition:transform ${REVEAL_MS}ms cubic-bezier(.4,0,.2,1);
}

.intro-content{ display:flex; flex-direction:column; align-items:center; gap:10px; }

.intro-badge{
  width:120px; height:120px; border-radius:32px; background:#fff;
  box-shadow:0 14px 34px rgba(0,0,0,.2);
  display:flex; align-items:center; justify-content:center;
  opacity:0; margin-bottom:8px;
}
.intro-badge img{ width:64px; height:64px; }

.intro-wordmark{
  font-family:var(--font-primary,"Hanken Grotesk",sans-serif); font-weight:800;
  font-size:32px; color:#fff; letter-spacing:-0.3px; opacity:0;
}
.intro-tagline{
  font-family:var(--font-primary,"Hanken Grotesk",sans-serif); font-weight:500;
  font-size:15px; color:rgba(255,255,255,.8); opacity:0;
}

.intro-loadbar{
  position:absolute; left:50%; bottom:12%; transform:translateX(-50%);
  width:150px; height:4px; border-radius:999px; background:rgba(255,255,255,.3);
  overflow:hidden; opacity:0;
}
.intro-loadbar-fill{
  position:absolute; top:0; left:0; height:100%; width:45%; border-radius:999px;
  background:#fff; animation:loadbar-slide 1.3s ease-in-out infinite;
}
@keyframes loadbar-slide{
  0%{ transform:translateX(-100%); }
  100%{ transform:translateX(330%); }
}

/* CSS fallback — used only when GSAP couldn't load. */
.intro-css-fallback .intro-badge{ animation:badge-in .45s ease .1s forwards; }
.intro-css-fallback .intro-wordmark{ animation:fade-up .35s ease .5s forwards; }
.intro-css-fallback .intro-tagline{ animation:fade-in .3s ease .65s forwards; }
.intro-css-fallback .intro-loadbar{ animation:fade-in .3s ease .1s forwards; }
@keyframes badge-in{ from{opacity:0; transform:scale(.82)} to{opacity:1; transform:scale(1)} }
@keyframes fade-up{ from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:translateY(0)} }
@keyframes fade-in{ from{opacity:0} to{opacity:1} }

.intro-skip{
  position:absolute; bottom:28px; right:28px; z-index:2;
  background:rgba(255,255,255,.14); color:#fff;
  border:1px solid rgba(255,255,255,.3); border-radius:999px;
  padding:8px 18px; font-size:13px; font-weight:600; cursor:pointer;
}
.intro-skip:hover{ background:rgba(255,255,255,.22); }
.intro-skip:focus-visible{ outline:3px solid #fff; outline-offset:2px; }

@media (max-width:640px){
  .intro-badge{ width:96px; height:96px; border-radius:26px; }
  .intro-badge img{ width:52px; height:52px; }
  .intro-wordmark{ font-size:26px; }
}

/* Reduced motion: quick fades, no bounce, no sliding bar. */
@media (prefers-reduced-motion: reduce){
  .intro-badge{ animation:badge-in .3s ease 0s forwards !important; opacity:0; }
  .intro-wordmark{ animation:fade-up .3s ease .1s forwards !important; opacity:0; }
  .intro-tagline{ animation:fade-in .3s ease .2s forwards !important; opacity:0; }
  .intro-loadbar{ animation:fade-in .2s ease 0s forwards !important; opacity:0; }
  .intro-loadbar-fill{ animation:none; width:100%; transform:none; }
}
`;
