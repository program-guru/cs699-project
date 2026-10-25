import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PlatformStatsSkeleton() {
  return (
    <>
      {["Universities Tracked", "Courses Tracked", "Days left for GATE"].map(
        (description) => (
          <Card key={description}>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-10 w-20" />
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ),
      )}
    </>
  )
}
