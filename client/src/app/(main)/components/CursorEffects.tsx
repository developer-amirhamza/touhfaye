"use client";
import { useEffect, useRef } from "react";

// Site-wide GSAP mouse hover effects:
//  1. A custom cursor — teal dot + trailing sand ring — that smoothly follows
//     the mouse (gsap.quickTo).
//  2. Hover states via event delegation: over any link/button the ring grows
//     and the target gently lifts/scales (magnetic feel), reverting on leave.
//
// Desktop-only (pointer: fine), skipped for reduced-motion users and touch
// devices. Native cursor stays visible (accessibility) — the dot/ring are an
// enhancement layered on top, never a replacement.
//
// Brand: teal #0e4127 · sand #1f8049
const INTERACTIVE = "a, button, [role='button'], input, select, textarea, label";

export default function CursorEffects() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Only run for precise pointers (mouse) and full-motion users.
    const finePointer = window.matchMedia?.("(pointer: fine)").matches;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || prefersReduced) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const gsap = (await import("gsap")).default;
        if (cancelled) return;
        const dot = dotRef.current;
        const ring = ringRef.current;
        if (!dot || !ring) return;

        gsap.set([dot, ring], { xPercent: -50, yPercent: -50, autoAlpha: 0 });

        // quickTo = extremely cheap per-frame tweens for cursor following.
        const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
        const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });
        const ringX = gsap.quickTo(ring, "x", { duration: 0.38, ease: "power3.out" });
        const ringY = gsap.quickTo(ring, "y", { duration: 0.38, ease: "power3.out" });

        let visible = false;
        const onMove = (e: MouseEvent) => {
          if (!visible) {
            visible = true;
            gsap.to([dot, ring], { autoAlpha: 1, duration: 0.25 });
          }
          dotX(e.clientX);
          dotY(e.clientY);
          ringX(e.clientX);
          ringY(e.clientY);
        };
        const onLeaveWindow = () => {
          visible = false;
          gsap.to([dot, ring], { autoAlpha: 0, duration: 0.25 });
        };

        // Delegated hover: ring grows over interactive elements; the element
        // itself gets a gentle lift. Skips anything opting out via data attr.
        const lifted = new WeakSet<Element>();
        const onOver = (e: MouseEvent) => {
          const target = (e.target as Element)?.closest?.(INTERACTIVE);
          if (!target || (target as HTMLElement).dataset.noHoverFx !== undefined) return;
          gsap.to(ring, { scale: 1, borderColor: "#0e4127", duration: 0.3 });
          gsap.to(dot, { scale: 0.5, duration: 0.3 });
          if (!lifted.has(target)) {
            lifted.add(target);
            gsap.to(target, { y: -2, scale: 1.03, duration: 0.3, ease: "power2.out" });
          }
        };
        const onOut = (e: MouseEvent) => {
          const target = (e.target as Element)?.closest?.(INTERACTIVE);
          if (!target) return;
          // Only revert when truly leaving the element (not moving to a child).
          const to = e.relatedTarget as Element | null;
          if (to && target.contains(to)) return;
          gsap.to(ring, { scale: 1, borderColor: "#1f8049", duration: 0.3 });
          gsap.to(dot, { scale: 1, duration: 0.3 });
          if (lifted.has(target)) {
            lifted.delete(target);
            gsap.to(target, { y: 0, scale: 1, duration: 0.35, ease: "power2.out" });
          }
        };

        // Press feedback.
        const onDown = () => gsap.to(ring, { scale: 0.85, duration: 0.15 });
        const onUp = () => gsap.to(ring, { scale: 1, duration: 0.2 });

        window.addEventListener("mousemove", onMove, { passive: true });
        document.addEventListener("mouseleave", onLeaveWindow);
        document.addEventListener("mouseover", onOver, { passive: true });
        document.addEventListener("mouseout", onOut, { passive: true });
        window.addEventListener("mousedown", onDown, { passive: true });
        window.addEventListener("mouseup", onUp, { passive: true });

        cleanup = () => {
          window.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseleave", onLeaveWindow);
          document.removeEventListener("mouseover", onOver);
          document.removeEventListener("mouseout", onOut);
          window.removeEventListener("mousedown", onDown);
          window.removeEventListener("mouseup", onUp);
          gsap.killTweensOf([dot, ring]);
        };
      } catch {
        // GSAP not installed → no cursor effects; site works exactly as before.
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div aria-hidden="true" style={{ pointerEvents: "none" }}>
      {/* Trailing ring */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1.5px solid #1f8049",
          zIndex: 9998,
          pointerEvents: "none",
          opacity: 0,
          willChange: "transform",
        }}
      />
      {/* Core dot */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#0e4127",
          zIndex: 9998,
          pointerEvents: "none",
          opacity: 0,
          willChange: "transform",
        }}
      />
    </div>
  );
}
