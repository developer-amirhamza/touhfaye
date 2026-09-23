// app/(main)/layout.tsx

import CursorEffects from "./components/CursorEffects";
import Footer from "./components/Footer";
import Header from "./components/Header";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      {/* Site-wide GSAP cursor + hover effects (desktop only) */}
      <CursorEffects />
      {children}
      <Footer />
    </>
  );
}
