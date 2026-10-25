import { DataCard } from "@/components/colleges/data-card";
import { SearchCard } from "@/components/colleges/search-card";

export default function Home() {
  return (
    <main className="flex flex-1 p-4 sm:p-6 lg:p-8">
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
        <SearchCard />
        <DataCard />
        <DataCard />
      </div>
    </main>
  );
}
