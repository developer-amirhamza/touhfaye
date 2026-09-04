// app/(main)/layout.tsx

import Chatbot from "./components/Chatbot";
import CursorEffects from "./components/CursorEffects";
import Footer from "./components/Footer";
import Header from "./components/Header";
import IntroOverlay from "./components/IntroOverlay";
import WaitlistPopup from "./components/WaitlistPopup";


export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* Homepage renders normally underneath; the intro overlays on top and
          removes itself after ~2s (once per browser, ever). If JS is off, the
          overlay never mounts and the site shows immediately — no blank screen. */}
      <IntroOverlay />
      <Header />
      {/* Site-wide GSAP cursor + hover effects (desktop only) */}
      <CursorEffects />
      {children}
      <Footer />
      <Chatbot/>
      <WaitlistPopup />
    </>
  );
}