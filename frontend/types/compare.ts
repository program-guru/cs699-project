import type { DTO } from "@/types/dto"

export interface ComparisonSummary {
  primary_course_id: string
  secondary_course_id: string
  overview: string
  similarities: string[]
  differences: string[]
  prerequisites_and_difficulty: string
  recommendation: string
  data_limitations: string | null
  model: string
  generated_at: string
}

export type ComparisonSummaryResponse = DTO<ComparisonSummary>
