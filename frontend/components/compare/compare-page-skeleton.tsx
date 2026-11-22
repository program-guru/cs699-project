import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ComparePageSkeleton() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card className="h-[min(60rem,calc(100vh-12rem))]" key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {Array.from({ length: 6 }, (_, detailIndex) => (
                <Skeleton className="h-10 w-full" key={detailIndex} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
