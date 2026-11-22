import { DataCard } from "@/components/home/number-card"
import type { CourseStatsResponse } from "@/types/course"
import type { ExamListResponse } from "@/types/exam"

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function getPlatformStats(): Promise<NonNullable<CourseStatsResponse["data"]>> {
  const response = await fetch(`${apiUrl}/misc/stats`, {
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(`Unable to load platform statistics (${response.status})`)
  }

  const payload: CourseStatsResponse = await response.json()
  if (!payload.success || !payload.data) {
    throw new Error(payload.message || "Unable to load platform statistics")
  }

  return payload.data
}

async function getTrackedExamCount(): Promise<number> {
  const response = await fetch(`${apiUrl}/exams/`, {
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(`Unable to load tracked exams (${response.status})`)
  }

  const payload: ExamListResponse = await response.json()
  if (!payload.success || !payload.data) {
    throw new Error(payload.message || "Unable to load tracked exams")
  }

  return payload.data.length
}

export async function PlatformStats() {
  const [stats, examCount] = await Promise.all([
    getPlatformStats(),
    getTrackedExamCount(),
  ])

  return (
    <>
      <DataCard number={stats.universities} description="Universities Tracked" />
      <DataCard number={stats.courses} description="Courses Tracked" />
      <DataCard number={examCount} description="Exams Tracked" />
    </>
  )
}
