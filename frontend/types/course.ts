import type { DTO } from "@/types/dto"

export interface Course {
  _id: string
  college_id: string
  college_name: string
  department_id: string
  department_name: string
  course_code: string | null
  title: string
  category: string | null
  level: string | null
  credits: number | null
  description: string | null
  prerequisites: string[]
  instructor: string | null
  semester_offered: string | null
  syllabus_url: string | null
  source_url: string
  scraped_at: string
  raw_extra: Record<string, unknown>
}

export type CourseRequest = Omit<Course, "_id" | "scraped_at">

export interface CoursePage {
  courses: Course[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export type CourseStats = {
  universities: number
  courses: number
}

export type CoursesResponse = DTO<CoursePage>
export type CourseResponse = DTO<Course>
export type CourseMutationResponse = DTO<null>
export type CourseStatsResponse = DTO<CourseStats>

export interface CourseQueryParams {
  college_id?: string
  department_id?: string
  page?: number
  page_size?: number
}
