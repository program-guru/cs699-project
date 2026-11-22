import type { DTO } from "@/types/dto"

export interface ExamDateValue {
  value: string
  revised: boolean
}

export interface ExamTimelineEvent {
  position: number
  activity: string
  dates: ExamDateValue[]
  days: ExamDateValue[]
}

export interface ExamTimeline {
  exam: string
  year: number
  source_url: string
  events: ExamTimelineEvent[]
}

export type ExamListResponse = DTO<string[]>
export type ExamTimelineResponse = DTO<ExamTimeline>
