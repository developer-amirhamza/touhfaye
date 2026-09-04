import SizeFinder from "@/app/(main)/components/SizeFinder";

export const metadata = {
  title: "Size Guide — Find your perfect fit | Aidble",
  description: "Find the right pull-up size in seconds with our Fit Finder — for you, or someone you care for.",
};

export default function SizeGuidePage() {
  return (
    <main className="bg-background min-h-screen py-10">
      <div className="container mx-auto px-6">
        <SizeFinder />
      </div>
    </main>
  );
}
