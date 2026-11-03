import type { DTO } from "@/types/dto"

export interface CollegeOption {
  id: string
  name: string
}

export interface DepartmentOption {
  id: string
  name: string
}

export type CollegesResponse = DTO<CollegeOption[]>
export type DepartmentsResponse = DTO<DepartmentOption[]>
