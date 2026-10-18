import { DataCard } from "@/components/home/number-card";
import { Hero } from "@/components/home/hero";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <section
        aria-label="Platform statistics"
        className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-12 sm:grid-cols-3 sm:px-6 sm:pb-16 lg:px-8 lg:pb-24"
      >
        <DataCard number={10} description="Universities Tracked" />
        <DataCard number={50} description="Courses Tracked" />
        <DataCard number={110} description="Days left for GATE" />
      </section>
    </main>
  );
}
