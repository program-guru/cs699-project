import type { DTO } from "@/types/dto"

export interface ScrapeSource {
  college_id: string
  department_id: string
  college_name: string
  department_name: string
}

export interface ScrapeRequest {
  college_id?: string
  department_id?: string
}

export type ScrapeSourcesResponse = DTO<ScrapeSource[]>
export type ScrapeResponse = DTO<null>
