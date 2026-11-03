import { Suspense } from "react";

import { Hero } from "@/components/home/hero";
import { PlatformStats } from "@/components/home/platform-stats";
import { PlatformStatsSkeleton } from "@/components/home/platform-stats-skeleton";

export default function Home() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <Hero />
      <section
        aria-label="Platform statistics"
        className="mx-auto grid w-full max-w-7xl shrink-0 gap-4 pb-8 sm:grid-cols-3 sm:pb-10 lg:pb-8"
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
