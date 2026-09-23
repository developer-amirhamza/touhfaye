import Hero from "./components/Hero";
import TrustStrip from "./components/TrustStrip";
import CategoryWiseProducts from "./components/CategoryWiseProducts";
import Spotlight from "./components/Spotlight";
import TestimonialsSection from "./components/TestimonialsSection";
import JournalPreview from "./components/JournalPreview";

export default function Home() {
  return (
    <div className="bg-background">
      <Hero />
      <TrustStrip />
      <CategoryWiseProducts />
      <Spotlight />
      <TestimonialsSection />
      <JournalPreview />
    </div>
  );
}
