"use client";
import React from "react";

// Infinite right-to-left auto-scrolling marquee. Children are duplicated so the
// loop is seamless. Pauses on hover/focus, and stops entirely for users who
// prefer reduced motion. Drop any items in — logos, badges, product cards, etc.
interface Props {
  children: React.ReactNode;
  speed?: number;    // seconds for one full loop (higher = slower)
  gap?: number;      // px gap between items
  className?: string;
  pauseOnHover?: boolean;
}

const AutoScrollSlider: React.FC<Props> = ({
  children,
  speed = 30,
  gap = 48,
  className = "",
  pauseOnHover = true,
}) => {
  return (
    <div
      className={`ass-viewport ${pauseOnHover ? "ass-pause" : ""} ${className}`}
      // Fade the edges so items enter/exit smoothly.
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
      }}
    >
      <style>{`
        .ass-viewport{ overflow:hidden; width:100%; }
        .ass-track{
          display:flex; width:max-content;
          animation:ass-scroll ${speed}s linear infinite;
        }
        .ass-pause:hover .ass-track,
        .ass-pause:focus-within .ass-track{ animation-play-state:paused; }
        .ass-group{ display:flex; align-items:center; flex-shrink:0; }
        @keyframes ass-scroll{
          from{ transform:translate3d(0,0,0); }
          to{ transform:translate3d(-50%,0,0); }
        }
        @media (prefers-reduced-motion: reduce){
          .ass-track{ animation:none; }
        }
      `}</style>

      <div className="ass-track">
        {/* Two identical groups → translating -50% loops seamlessly. */}
        <div className="ass-group" style={{ gap, paddingRight: gap }} aria-hidden="false">
          {children}
        </div>
        <div className="ass-group" style={{ gap, paddingRight: gap }} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AutoScrollSlider;
