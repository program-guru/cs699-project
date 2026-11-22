import type { Metadata } from "next"

import { ExamBrowser } from "@/components/exams/exam-browser"

interface ExamPageProps {
  params: Promise<{ exam: string }>
  searchParams: Promise<{ year?: string }>
}

export async function generateMetadata({
  params,
}: ExamPageProps): Promise<Metadata> {
  const { exam } = await params
  return {
    title: `${exam.toUpperCase()} Timeline`,
  }
}

export default async function ExamPage({
  params,
  searchParams,
}: ExamPageProps) {
  const { exam } = await params
  const { year } = await searchParams
  const parsedYear = year ? Number(year) : undefined

  return (
    <ExamBrowser
      selectedExam={exam.toUpperCase()}
      year={Number.isFinite(parsedYear) ? parsedYear : undefined}
    />
  )
}
