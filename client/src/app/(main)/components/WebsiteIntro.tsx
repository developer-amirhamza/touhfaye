"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface IntroProps {
  onComplete: () => void; // called when intro finishes
}

export default function WebsiteIntro({ onComplete }: IntroProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dropletRef = useRef<HTMLDivElement>(null);
  const splashRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(media.matches);
    const handler = () => setIsReducedMotion(media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  // Main animation
  useEffect(() => {
    // If reduced motion, skip immediately
    if (isReducedMotion) {
      onComplete();
      return;
    }

    // If already skipped, don't run animation
    if (isSkipped) {
      onComplete();
      return;
    }

    const tl = gsap.timeline({
      paused: false,
      onComplete: () => {
        // Intro finished – fade out overlay and call onComplete
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: () => {
            onComplete();
          },
        });
      },
    });

    // 1. Cream background already visible
    // 2. Droplet falls (0.0s – 0.4s)
    tl.fromTo(
      dropletRef.current,
      { y: -100, opacity: 1 },
      { y: 80, duration: 0.6, ease: "power1.in", delay: 0.1 }
    )
      // 3. Splash + ripple (0.4s – 0.9s)
      .to(dropletRef.current, {
        scale: 0.3,
        opacity: 0,
        duration: 0.2,
        ease: "power2.out",
      })
      .to(
        splashRef.current,
        {
          scale: 1.2,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        },
        "-=0.1"
      )
      .to(
        rippleRef.current,
        {
          scale: 1.8,
          opacity: 0.6,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.2"
      )
      // 4. Water absorbs – surface dries (0.9s – 1.5s)
      .to(splashRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: "power2.in",
      })
      .to(
        rippleRef.current,
        {
          scale: 0.5,
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
        },
        "-=0.3"
      )
      // 5. Logo appears (1.5s – 2.0s)
      .fromTo(
        logoRef.current,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
        },
        "-=0.2"
      )
      // 6. Hold for a moment, then fade out overlay (handled by onComplete above)
      .to(logoRef.current, {
        scale: 1.1,
        duration: 0.3,
        ease: "power1.inOut",
        yoyo: true,
        repeat: 1,
      });

    // Skip button handler
    const handleSkip = () => {
      setIsSkipped(true);
      tl.kill(); // stop animation
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => onComplete(),
      });
    };

    const skipBtn = skipRef.current;
    if (skipBtn) skipBtn.addEventListener("click", handleSkip);

    return () => {
      tl.kill();
      if (skipBtn) skipBtn.removeEventListener("click", handleSkip);
    };
  }, [onComplete, isReducedMotion, isSkipped]);

  // If reduced motion, render nothing (or a very brief fade)
  if (isReducedMotion) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#FFF7F1" }}
    >
      {/* Skip button */}
      <button
        ref={skipRef}
        className="absolute top-4 right-4 px-3 py-1 text-sm text-gray-600 bg-white/70 rounded hover:bg-white transition z-50"
      >
        Skip intro
      </button>

      {/* Droplet */}
      <div
        ref={dropletRef}
        className="absolute"
        style={{
          width: "20px",
          height: "40px",
          backgroundColor: "#2E7D71",
          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          opacity: 0,
        }}
      />

      {/* Splash (burst of small circles) */}
      <div
        ref={splashRef}
        className="absolute w-16 h-16 opacity-0"
        style={{
          background: "radial-gradient(circle, #2E7D71 20%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* Ripple (ring) */}
      <div
        ref={rippleRef}
        className="absolute w-10 h-10 opacity-0"
        style={{
          border: "4px solid #2E7D71",
          borderRadius: "50%",
        }}
      />

      {/* Logo */}
      <div
        ref={logoRef}
        className="text-6xl font-bold opacity-0 select-none"
        style={{ color: "#C9573F" }}
      >
        Bestiee
      </div>
    </div>
  );
}