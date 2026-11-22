import { Sparkles } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage } from "@/lib/features/api/error"
import type { ComparisonSummary } from "@/types/compare"

interface AISummaryCardProps {
  summary: ComparisonSummary | null
  error?: unknown
  isError: boolean
  isLoading: boolean
}

function SummarySection({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-heading text-sm font-semibold tracking-wider uppercase">
        {title}
      </h3>
      <div className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

function SummaryList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p>Not specified in the available course data.</p>
  }

  return (
    <ul className="flex list-disc flex-col gap-2 pl-5">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  )
}

export function AISummaryCard({
  summary,
  error,
  isError,
  isLoading,
}: AISummaryCardProps) {
  return (
    <Card
      className="flex h-[min(60rem,calc(100vh-12rem))] min-h-0 min-w-0 flex-col xl:col-span-1"
      size="sm"
    >
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles aria-hidden="true" />
          AI summary
        </CardTitle>
        <CardDescription>
          A concise comparison based on the available course catalog data.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-64 min-w-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-5">
            {Array.from({ length: 6 }, (_, index) => (
              <div className="flex flex-col gap-2" key={index}>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Summary unavailable</EmptyTitle>
              <EmptyDescription>
                {getApiErrorMessage(
                  error,
                  "We could not generate a comparison right now.",
                )}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : !summary ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Select a secondary course</EmptyTitle>
              <EmptyDescription>
                Choose a course from the panel to generate an AI comparison.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-5">
            <SummarySection title="Overview">{summary.overview}</SummarySection>
            <Separator />
            <SummarySection title="Similarities">
              <SummaryList items={summary.similarities} />
            </SummarySection>
            <Separator />
            <SummarySection title="Differences">
              <SummaryList items={summary.differences} />
            </SummarySection>
            <Separator />
            <SummarySection title="Prerequisites and difficulty">
              {summary.prerequisites_and_difficulty}
            </SummarySection>
            <Separator />
            <SummarySection title="Recommendation">
              {summary.recommendation}
            </SummarySection>
            {summary.data_limitations ? (
              <>
                <Separator />
                <SummarySection title="Data limitations">
                  {summary.data_limitations}
                </SummarySection>
              </>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
