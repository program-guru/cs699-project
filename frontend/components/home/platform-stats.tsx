"use client"

import { DataCard } from "@/components/home/number-card"
import { PlatformStatsSkeleton } from "@/components/home/platform-stats-skeleton"
import { useGetExamsQuery } from "@/lib/features/exams/exams.api"
import { useGetPlatformStatsQuery } from "@/lib/features/misc/misc.api"

export function PlatformStats() {
  const {
    data: statsResponse,
    isLoading: isLoadingStats,
  } = useGetPlatformStatsQuery()
  const {
    data: examsResponse,
    isLoading: isLoadingExams,
  } = useGetExamsQuery()

  if (isLoadingStats || isLoadingExams) {
    return <PlatformStatsSkeleton />
  }

  const stats = statsResponse?.data
  const examCount = examsResponse?.data?.length ?? 0

  if (!stats) {
    return null
  }

  return (
    <>
      <DataCard number={stats.universities} description="Universities Tracked" />
      <DataCard number={stats.courses} description="Courses Tracked" />
      <DataCard number={examCount} description="Exams Tracked" />
    </>
  )
}
