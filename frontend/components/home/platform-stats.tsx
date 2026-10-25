import { DataCard } from "@/components/home/number-card"
import type { CourseStatsResponse } from "@/types/course"

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function getPlatformStats(): Promise<NonNullable<CourseStatsResponse["data"]>> {
  const response = await fetch(`${apiUrl}/courses/stats`, {
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

export async function PlatformStats() {
  const stats = await getPlatformStats()

  return (
    <>
      <DataCard number={stats.universities} description="Universities Tracked" />
      <DataCard number={stats.courses} description="Courses Tracked" />
      <DataCard number="--" description="Days left for GATE" />
    </>
  )
}
