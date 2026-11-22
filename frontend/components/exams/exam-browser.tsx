"use client"

import { useRouter } from "next/navigation"
import { CalendarRange, MousePointerClick } from "lucide-react"

import { ExamTimeline } from "@/components/exams/exam-timeline"
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
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetExamsQuery } from "@/lib/features/exams/exams.api"

interface ExamBrowserProps {
  selectedExam?: string
  year?: number
}

export function ExamBrowser({ selectedExam, year }: ExamBrowserProps) {
  const router = useRouter()
  const { data, isLoading, isError } = useGetExamsQuery()
  const exams = data?.data ?? []

  return (
    <main className="min-h-0 flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="grid h-[min(60rem,calc(100vh-12rem))] min-h-0 w-full grid-cols-1 gap-6 xl:grid-cols-4">
        <Card
          className="flex min-h-0 min-w-0 flex-col xl:col-span-1"
          size="sm"
        >
          <CardHeader className="shrink-0 gap-1">
            <CardTitle>Exams</CardTitle>
            <CardDescription>Select an exam to view its timeline.</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col gap-2" aria-label="Loading exams">
                {Array.from({ length: 5 }, (_, index) => (
                  <Skeleton className="h-12 w-full" key={index} />
                ))}
              </div>
            ) : isError ? (
              <p className="text-sm text-destructive">
                Exams could not be loaded.
              </p>
            ) : exams.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CalendarRange aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No exams available</EmptyTitle>
                  <EmptyDescription>
                    Registered exam timelines will appear here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ScrollArea className="h-full pr-2">
                <nav aria-label="Available exams" className="flex flex-col gap-2">
                  {exams.map((exam) => {
                    const isSelected =
                      selectedExam?.toUpperCase() === exam.toUpperCase()

                    return (
                      <button
                        type="button"
                        key={exam}
                        aria-current={isSelected ? "page" : undefined}
                        className={`flex h-12 w-full items-center justify-between border px-4 text-left text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-foreground hover:bg-muted"
                        }`}
                        onClick={() => router.push(`/exams/${encodeURIComponent(exam)}`)}
                      >
                        <span>{exam}</span>
                        {isSelected ? (
                          <span
                            className="size-2 rounded-full bg-primary"
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    )
                  })}
                </nav>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {selectedExam ? (
          <div className="min-h-0 min-w-0 xl:col-span-3">
            <ExamTimeline examName={selectedExam} year={year} />
          </div>
        ) : (
          <Card
            className="flex min-h-0 min-w-0 flex-col xl:col-span-3"
            size="sm"
          >
            <CardHeader className="shrink-0 gap-1">
              <CardTitle>Exam timeline</CardTitle>
              <CardDescription>
                Choose an exam to view its important dates.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1">
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MousePointerClick aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Select an exam</EmptyTitle>
                  <EmptyDescription className="max-w-full whitespace-nowrap">
                    Select an exam to view its important dates.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
