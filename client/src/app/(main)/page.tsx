
import Hero from "./components/Hero";
import CategoryWiseProducts from "./components/CategoryWiseProducts";
import TestimonialsSection from "./components/TestimonialsSection";
import CareGuidesSection from "./components/CareGuidesSection";
import ProductFinderCalculator from "./components/ProductFinderCalculator";
import FeatureSection from "./components/FeatureSection";
import EntryPoints from "./components/EntryPoints";
import NdisSupportSection from "./components/NdisSupportSection";
import CommunitySection from "./components/CommunitySection";
import YouAreNotAlone from "./components/YouAreNotAlone";
import TrainingSessionsSection from "./components/TrainingSessionsSection";
import RedditFeedSection from "./components/RedditFeedSection";


export default function Home() {


  return (
    <div className="grid grid-cols-1 gap-0 mb-10 h-full bg-pr">
      <Hero />
      <div className="grid grid-cols-1">
        <CategoryWiseProducts />
      </div>
      <EntryPoints />
      <ProductFinderCalculator />
      <NdisSupportSection />
      <YouAreNotAlone />


      {/* Hero infographic strip */}
      {/* <div className="bg-[#f5f0eb] border-y border-[#e5ddd5]">
        <div className="container mx-auto flex divide-x divide-[#e5ddd5]">
          {infographic_cards.hero.map((item, index) => (
            <div key={index} className="flex-1">
              <InfoGraphicCard label={item.label} subtitle={(item as any).subtitle} icon={item.icon} path={item.path} />
            </div>
          ))}
        </div>
      </div> */}



      {/* Policies infographic strip */}
      {/* <div className="bg-[#f5f0eb] border-y border-[#e5ddd5]">
        <div className="container mx-auto flex flex-wrap divide-x divide-[#e5ddd5]">
          {infographic_cards.policies.map((item, index) => (
            <div key={index} className="flex-1 min-w-37.5">
              <InfoGraphicCard label={item.label} subtitle={(item as any).subtitle} icon={item.icon} path={item.path} />
            </div>
          ))}
        </div>
      </div> */}
      {/* <FeatureSection /> */}
      <CareGuidesSection />
      <div id="community" className="scroll-mt-27.5">
        <CommunitySection />
      </div>
      <RedditFeedSection />
      <TrainingSessionsSection />
        <TestimonialsSection />

      {/* <TrustedStrip /> */}
      {/* <div className="grid container bg-primary  gap-10">
        {home_posts.map((post, index) => (
          <PostCard image={post.image} key={index} title={post.title} subtitle={post.subtitle} paragraph={post.paragraph} buttons={post.buttons} />
        ))}
      </div> */}
    </div>
  );
}