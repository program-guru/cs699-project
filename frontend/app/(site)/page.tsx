import { Suspense } from "react";

import { Hero } from "@/components/home/hero";
import { PlatformStats } from "@/components/home/platform-stats";
import { PlatformStatsSkeleton } from "@/components/home/platform-stats-skeleton";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <section
        aria-label="Platform statistics"
        className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-12 sm:grid-cols-3 sm:px-6 sm:pb-16 lg:px-8 lg:pb-24"
      >
        <Suspense
          fallback={<PlatformStatsSkeleton />}
        >
          <PlatformStats />
        </Suspense>
      </section>
    </main>
  );
}
