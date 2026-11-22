import type { DTO } from "@/types/dto"

export interface ScrapeRequest {
  college_name: string
  department_name: string
}

export type ScrapeResponse = DTO<null>
export type CollegesResponse = DTO<string[]>
export type DepartmentsResponse = DTO<string[]>
