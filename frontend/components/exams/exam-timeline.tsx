"use client"

import {
  CalendarDays,
  Check,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  Clock3,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/toast"
import {
  useGetExamTimelineQuery,
  useRefreshExamTimelineMutation,
} from "@/lib/features/exams/exams.api"
import { getApiErrorMessage } from "@/lib/features/api/error"
import { useAppSelector } from "@/lib/hooks"

interface ExamTimelineProps {
  examName: string
  year?: number
}

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

function getLatestDate(value: string): number | null {
  const timestamps: number[] = []

  const ordinal = /(\d{1,2})\s*(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi
  for (const match of value.matchAll(ordinal)) {
    const date = new Date(
      Number(match[3]),
      MONTHS[match[2].toLowerCase()],
      Number(match[1]),
    )
    if (Number.isFinite(date.getTime())) timestamps.push(date.getTime())
  }

  const monthFirst = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/gi
  for (const match of value.matchAll(monthFirst)) {
    const date = new Date(
      Number(match[3]),
      MONTHS[match[1].toLowerCase()],
      Number(match[2]),
    )
    if (Number.isFinite(date.getTime())) timestamps.push(date.getTime())
  }

  return timestamps.length ? Math.max(...timestamps) : null
}

function getEventDate(event: { dates: { value: string }[] }): number | null {
  const timestamps = event.dates
    .map((date) => getLatestDate(date.value))
    .filter((timestamp): timestamp is number => timestamp !== null)
  return timestamps.length ? Math.max(...timestamps) : null
}

function renderOrdinalDate(value: string) {
  const normalized = value.replace(/(\d)\s+(st|nd|rd|th)\b/gi, "$1$2")
  const parts = normalized.split(/(\d+(?:st|nd|rd|th))/gi)

  return parts.map((part, index) => {
    const match = part.match(/^(\d+)(st|nd|rd|th)$/i)
    if (!match) {
      return <span key={index}>{part}</span>
    }

    return (
      <span key={index}>
        {match[1]}
        <sup className="ml-px text-[0.65em]">{match[2].toLowerCase()}</sup>
      </span>
    )
  })
}

export function ExamTimeline({ examName, year }: ExamTimelineProps) {
  const isAuthenticated = useAppSelector(
    (state) => state.auth.isAuthenticated,
  )
  const { data, isLoading, isError, error } = useGetExamTimelineQuery({
    exam: examName,
    year,
  })
  const [refreshTimeline, refreshState] = useRefreshExamTimelineMutation()
  const timeline = data?.data
  const now = new Date().setHours(23, 59, 59, 999)

  const sortedEvents = timeline
    ? [...timeline.events].sort((left, right) => {
        const leftDate = getEventDate(left)
        const rightDate = getEventDate(right)
        if (leftDate === null && rightDate === null) {
          return left.position - right.position
        }
        if (leftDate === null) return 1
        if (rightDate === null) return -1
        return rightDate - leftDate
      })
    : []

  const refresh = async () => {
    try {
      const response = await refreshTimeline({ exam: examName, year }).unwrap()
      toast.add({
        type: "success",
        title: "Timeline refreshed",
        description: response.message,
      })
    } catch (requestError) {
      toast.add({
        type: "error",
        title: "Unable to refresh timeline",
        description: getApiErrorMessage(requestError, "Please try again."),
      })
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <header className="shrink-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit">
            <CalendarDays aria-hidden="true" />
            {year ? `Academic year ${year}` : "Official timeline"}
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {timeline ? `${timeline.exam} ${timeline.year}` : examName.toUpperCase()}
          </h1>
        </div>

        {isAuthenticated ? (
          <Button
            size="sm"
            variant="outline"
            disabled={refreshState.isLoading}
            onClick={refresh}
          >
            {refreshState.isLoading ? (
              <LoaderCircle
                data-icon="inline-start"
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <RefreshCw data-icon="inline-start" aria-hidden="true" />
            )}
            Refresh
          </Button>
        ) : null}
      </header>

      {isLoading ? (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardContent className="p-0">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="grid grid-cols-[4rem_1fr] px-5 py-7" key={index}>
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="flex min-h-0 flex-1 flex-col">
          <CardHeader>
            <CardTitle>Timeline unavailable</CardTitle>
            <CardDescription>
              {getApiErrorMessage(error, "The exam timeline could not be loaded.")}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : timeline ? (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-border/70 py-0 shadow-sm" size="sm">
          <CardHeader className="shrink-0 border-b bg-muted/20 px-5 py-5 sm:px-8">
            <CardTitle className="text-lg">Important dates</CardTitle>
            <CardDescription>
              <a
                className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
                href={timeline.source_url}
                target="_blank"
                rel="noreferrer"
              >
                Official {timeline.exam} website
                <ExternalLink aria-hidden="true" />
              </a>
            </CardDescription>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              <div className="pr-3">
            {sortedEvents.map((event, index) => {
              const eventDate = getEventDate(event)
              const isCompleted = eventDate !== null && eventDate < now
              const dateLines = event.dates.map((date) => date.value)
              const dayLines = event.days.map((day) => day.value)

              return (
                <div
                  className="group grid grid-cols-[3.75rem_1fr] transition-colors duration-200 hover:bg-muted/30 sm:grid-cols-[5.25rem_1fr]"
                  key={event.position}
                >
                  <div className="relative flex justify-center pt-7">
                    {index < sortedEvents.length - 1 ? (
                      <span
                        className={`absolute top-12 h-[calc(100%-1.5rem)] w-px ${
                          isCompleted ? "bg-destructive" : "bg-border"
                        }`}
                        aria-hidden="true"
                      />
                    ) : null}
                    <span
                      className={`relative z-10 flex size-9 items-center justify-center rounded-full border transition-transform duration-200 group-hover:scale-105 ${
                        isCompleted
                          ? "border-destructive/30 bg-destructive text-destructive-foreground"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                      aria-label={isCompleted ? "Completed" : "Upcoming"}
                    >
                      {isCompleted ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <Clock3 aria-hidden="true" />
                      )}
                    </span>
                  </div>

                  <div className="min-w-0 py-6 pr-5 sm:pr-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        className={`font-semibold ${
                          isCompleted ? "text-destructive" : "text-foreground"
                        }`}
                      >
                        {event.activity}
                      </h2>
                      {event.dates.some((date) => date.revised) ||
                      event.days.some((day) => day.revised) ? (
                        <Badge variant="destructive">Revised</Badge>
                      ) : null}
                    </div>

                    {dateLines.length ? (
                      <div
                        className={`mt-2 text-sm font-medium ${
                          isCompleted
                            ? "text-destructive"
                            : "text-primary"
                        }`}
                      >
                        {dateLines.map((date, index) => (
                          <span key={`${date}-${index}`}>
                            {index > 0 ? " · " : null}
                            {renderOrdinalDate(date)}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {dayLines.length ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {dayLines.join(" · ")}
                      </p>
                    ) : null}
                  </div>

                  {index < sortedEvents.length - 1 ? (
                    <div className="col-span-2 pl-[3.75rem] sm:pl-[5.25rem]">
                      <Separator />
                    </div>
                  ) : null}
                </div>
              )
            })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
